import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type IdentifyResult = {
  confidence: number; // 0-100
  title: string | null;
  year: number | null;
  player: string | null;
  manufacturer: string | null;
  team: string | null;
  league: string | null;
  sport: string | null;
  set_name: string | null;
  card_number: string | null;
  condition: string | null;
  condition_detail: string | null;
  country_of_origin: string | null;
  original_licensed_reprint: string | null;
  parallel_variety: string | null;
  features: string | null;
  season: string | null;
  year_manufactured: number | null;
  autograph: boolean | null;
  is_graded: boolean | null;
  grading_company: string | null;
  grade: string | null;
  evidence_text: string | null;

  estimated_price: number | null;
  estimated_currency: string | null;
  ebay_listings_used: number;

  ebay_listings: Array<{
    title: string;
    price: number;
    currency: string;
    web_url: string;
    image_url?: string;
  }>;
};

function clampInt(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}

function extractYearFromText(text: string): number | null {
  const s = String(text || "");

  // Prefer season formats like 2015-16 -> 2015
  const season = s.match(/\b(19\d{2}|20\d{2})\s*[\/-]\s*\d{2}\b/);
  if (season?.[1]) {
    const y = Number(season[1]);
    if (Number.isFinite(y)) return clampInt(y, 1900, 2100);
  }

  // Otherwise pick the first 4-digit year in a reasonable range
  const m = s.match(/\b(19\d{2}|20\d{2})\b/);
  if (m?.[1]) {
    const y = Number(m[1]);
    if (Number.isFinite(y)) return clampInt(y, 1900, 2100);
  }

  return null;
}

function coerceYear(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input))
    return clampInt(input, 1900, 2100);
  if (typeof input === "string") {
    const y = extractYearFromText(input);
    if (y != null) return y;
    const n = Number(input);
    if (Number.isFinite(n)) return clampInt(n, 1900, 2100);
  }
  return null;
}

function coerceConfidence(input: unknown): number {
  if (typeof input === "number" && Number.isFinite(input)) {
    // allow either 0-1 or 0-100
    if (input <= 1) return clampInt(input * 100, 0, 100);
    return clampInt(input, 0, 100);
  }
  if (typeof input === "string") {
    const n = Number(input);
    if (Number.isFinite(n)) return coerceConfidence(n);
  }
  return 0;
}

const identifyOutputSchema = z
  .object({
    confidence: z.any().optional(),
    title: z.string().nullable().optional(),
    year: z.any().optional(),
    player: z.string().nullable().optional(),
    manufacturer: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
    league: z.string().nullable().optional(),
    sport: z.string().nullable().optional(),
    set_name: z.string().nullable().optional(),
    card_number: z.string().nullable().optional(),
    condition: z.string().nullable().optional(),
    condition_detail: z.string().nullable().optional(),
    country_of_origin: z.string().nullable().optional(),
    original_licensed_reprint: z.string().nullable().optional(),
    parallel_variety: z.string().nullable().optional(),
    features: z.string().nullable().optional(),
    season: z.string().nullable().optional(),
    year_manufactured: z.any().optional(),
    autograph: z.boolean().nullable().optional(),
    is_graded: z.boolean().nullable().optional(),
    grading_company: z.string().nullable().optional(),
    grade: z.string().nullable().optional(),
    evidence_text: z.string().nullable().optional(),
  })
  .passthrough();

const MARKETPLACE_ID_MAP = {
  US: "EBAY_US",
  CA: "EBAY_CA",
  GB: "EBAY_GB",
  DE: "EBAY_DE",
  FR: "EBAY_FR",
  AU: "EBAY_AU",
} as const;

type CountryCode = keyof typeof MARKETPLACE_ID_MAP;

type Money = { value?: string | number; currency?: string };

type RawEbayItemSummary = {
  title?: string;
  condition?: string;
  price?: Money;
  itemWebUrl?: string;
  itemLocation?: { country?: string };
  image?: { imageUrl?: string };
  thumbnailImages?: Array<{ imageUrl?: string }>;
  imageUrl?: string;
};

type RawEbaySearchResponse = {
  itemSummaries?: RawEbayItemSummary[];
};

const ebayTokenCache = new Map<
  string,
  {
    accessToken: string;
    expiresAtMs: number;
  }
>();

function assertEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

function percentile(sortedArr: number[], p: number) {
  if (sortedArr.length === 0) return 0;
  const idx = (p / 100) * (sortedArr.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  const w = idx - lo;
  return sortedArr[lo] * (1 - w) + sortedArr[hi] * w;
}

function iqrFilteredMean(prices: number[]) {
  if (!prices.length) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const filtered = sorted.filter((x) => x >= lower && x <= upper);
  if (!filtered.length) return 0;
  const sum = filtered.reduce((a, b) => a + b, 0);
  return sum / filtered.length;
}

function numberFromMoney(m?: Money) {
  const v = m?.value;
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
}

function currencyFromMoney(m?: Money) {
  return typeof m?.currency === "string" ? m.currency : "";
}

async function getEbayAccessToken(scope: string) {
  const now = Date.now();
  const cached = ebayTokenCache.get(scope);
  if (cached && cached.expiresAtMs - now > 30_000) return cached.accessToken;

  const clientId = assertEnv("EBAY_CLIENT_ID");
  const clientSecret = assertEnv("EBAY_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token error (${res.status}): ${text}`);
  }

  const data: { access_token: string; expires_in: number } = await res.json();
  const token = {
    accessToken: data.access_token,
    expiresAtMs: Date.now() + data.expires_in * 1000,
  };
  ebayTokenCache.set(scope, token);
  return token.accessToken;
}

async function ebayBrowseSearch({
  query,
  accessToken,
  marketplaceId,
  limit = 20,
}: {
  query: string;
  accessToken: string;
  marketplaceId: string;
  limit?: number;
}) {
  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay search error (${res.status}): ${text}`);
  }
  return res.json();
}

function extractEbayImgSize(url: string) {
  const m = url.match(/\/s-l(\d+)(?:\.|\/)/i);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? n : null;
}

function upgradeEbayImageUrl(url: string, minSize: number) {
  const currentSize = extractEbayImgSize(url);
  if (currentSize && currentSize >= minSize) return url;
  if (currentSize) return url.replace(/\/s-l\d+(?=\.|\/)/i, `/s-l${minSize}`);
  return url;
}

function pickBestImageUrl(item: RawEbayItemSummary, minSize = 500) {
  const candidates = [
    item.image?.imageUrl,
    item.imageUrl,
    ...(item.thumbnailImages?.map((t) => t.imageUrl) ?? []),
  ].filter((x): x is string => typeof x === "string" && x.trim().length > 0);

  if (!candidates.length) return undefined;

  const upgraded = candidates.map((url) => upgradeEbayImageUrl(url, minSize));
  upgraded.sort(
    (a, b) => (extractEbayImgSize(b) ?? -1) - (extractEbayImgSize(a) ?? -1)
  );
  return upgraded[0];
}

function buildEbayQuery(input: {
  year: number | null;
  player: string | null;
  manufacturer: string | null;
  set_name: string | null;
  card_number: string | null;
  autograph: boolean | null;
  grading_company: string | null;
  grade: string | null;
}) {
  const parts = [
    input.year != null ? String(input.year) : null,
    input.manufacturer,
    input.set_name,
    input.player,
    input.card_number ? `#${input.card_number}` : null,
    input.autograph ? "auto" : null,
    input.grading_company,
    input.grade,
  ]
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());

  const q = parts.join(" ").trim();
  return q.length > 120 ? q.slice(0, 120) : q;
}

async function fileToDataUrl(file: File): Promise<string> {
  const type = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");
  return `data:${type};base64,${base64}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing server configuration: OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const images = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File);

  const countryRaw = String(formData.get("country") ?? "CA").trim().toUpperCase();
  const country: CountryCode =
    countryRaw in MARKETPLACE_ID_MAP ? (countryRaw as CountryCode) : "CA";

  if (images.length === 0) {
    return NextResponse.json(
      { error: "At least one image is required." },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const limited = images.slice(0, 6);
  const imageParts = await Promise.all(
    limited.map(async (file) => ({
      type: "image_url" as const,
      image_url: { url: await fileToDataUrl(file) },
    }))
  );

  const prompt =
    "You are identifying a sports trading card from photos (possibly inside a graded slab). " +
    "IMPORTANT: Read any visible label text (OCR) from the grading label and the card itself. " +
    "Extract the best-guess structured fields. " +
    "Return JSON ONLY with keys: " +
    "confidence (0-100 integer), title, year, player, manufacturer, team, league, sport, " +
    "set_name, card_number, condition, condition_detail, country_of_origin, " +
    "original_licensed_reprint, parallel_variety, features, season, year_manufactured, " +
    "autograph (boolean|null), is_graded (boolean|null), grading_company, grade, evidence_text. " +
    "Use null for unknown fields. " +
    "For year: return a number. If the card uses a season like 2015-16, return 2015. " +
    "If a graded label is visible, set is_graded=true, grading_company and grade accordingly. " +
    "If the card indicates an autograph (e.g., auto/Autograph/on-card signature), set autograph=true, else false if clearly not. " +
    "evidence_text should be a short concatenation of the key text you read (e.g., label lines) to support the extraction. " +
    "Confidence should reflect how sure you are about the OVERALL identification.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, ...imageParts],
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? "{}";
    const parsedJson = JSON.parse(content) as unknown;
    const parsed = identifyOutputSchema.parse(parsedJson);

    const title = typeof parsed.title === "string" ? parsed.title.trim() || null : null;
    const evidenceText =
      typeof parsed.evidence_text === "string"
        ? parsed.evidence_text.trim() || null
        : null;

    const yearFromModel = coerceYear(parsed.year);
    const yearFromText = extractYearFromText(`${title ?? ""} ${evidenceText ?? ""}`);
    const year = yearFromModel ?? yearFromText;

    const result: IdentifyResult = {
      confidence: coerceConfidence(parsed.confidence),
      title,
      year,
      player:
        typeof parsed.player === "string" ? parsed.player.trim() || null : null,
      manufacturer:
        typeof parsed.manufacturer === "string"
          ? parsed.manufacturer.trim() || null
          : null,
      team: typeof parsed.team === "string" ? parsed.team.trim() || null : null,
      league:
        typeof parsed.league === "string" ? parsed.league.trim() || null : null,
      sport: typeof parsed.sport === "string" ? parsed.sport.trim() || null : null,
      set_name:
        typeof parsed.set_name === "string"
          ? parsed.set_name.trim() || null
          : null,
      card_number:
        typeof parsed.card_number === "string"
          ? parsed.card_number.trim() || null
          : null,
      condition:
        typeof parsed.condition === "string"
          ? parsed.condition.trim() || null
          : null,
      condition_detail:
        typeof parsed.condition_detail === "string"
          ? parsed.condition_detail.trim() || null
          : null,
      country_of_origin:
        typeof parsed.country_of_origin === "string"
          ? parsed.country_of_origin.trim() || null
          : null,
      original_licensed_reprint:
        typeof parsed.original_licensed_reprint === "string"
          ? parsed.original_licensed_reprint.trim() || null
          : null,
      parallel_variety:
        typeof parsed.parallel_variety === "string"
          ? parsed.parallel_variety.trim() || null
          : null,
      features:
        typeof parsed.features === "string" ? parsed.features.trim() || null : null,
      season:
        typeof parsed.season === "string" ? parsed.season.trim() || null : null,
      year_manufactured: coerceYear(parsed.year_manufactured),
      autograph: typeof parsed.autograph === "boolean" ? parsed.autograph : null,
      is_graded: typeof parsed.is_graded === "boolean" ? parsed.is_graded : null,
      grading_company:
        typeof parsed.grading_company === "string"
          ? parsed.grading_company.trim() || null
          : null,
      grade: typeof parsed.grade === "string" ? parsed.grade.trim() || null : null,
      evidence_text: evidenceText,

      estimated_price: null,
      estimated_currency: null,
      ebay_listings_used: 0,

      ebay_listings: [],
    };

    // Similar items via eBay Browse API -> estimated price
    try {
      if (process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET) {
        const marketplaceId = MARKETPLACE_ID_MAP[country];
        const q = buildEbayQuery({
          year: result.year,
          player: result.player,
          manufacturer: result.manufacturer,
          set_name: result.set_name,
          card_number: result.card_number,
          autograph: result.autograph,
          grading_company: result.grading_company,
          grade: result.grade,
        });

        if (q.length >= 2) {
          const scope = "https://api.ebay.com/oauth/api_scope";
          const token = await getEbayAccessToken(scope);
          const resp = (await ebayBrowseSearch({
            query: q,
            accessToken: token,
            marketplaceId,
            limit: 20,
          })) as RawEbaySearchResponse;

          const items = (resp.itemSummaries ?? [])
            .slice(0, 12)
            .map((item) => ({
              title: item.title ?? "",
              price: numberFromMoney(item.price),
              currency: currencyFromMoney(item.price),
              web_url: item.itemWebUrl ?? "",
              image_url: pickBestImageUrl(item, 500),
            }))
            .filter((it) => it.title && it.web_url && it.price > 0);

          result.ebay_listings = items.slice(0, 6);

          const currency = items.find((x) => x.currency)?.currency || "";
          const prices = items
            .filter((x) => !currency || x.currency === currency)
            .map((x) => x.price)
            .filter((n) => Number.isFinite(n) && n > 0);

          if (prices.length) {
            const mean = iqrFilteredMean(prices);
            const estimate =
              mean > 0
                ? mean
                : percentile([...prices].sort((a, b) => a - b), 50);
            result.estimated_price =
              estimate > 0 ? Number(estimate.toFixed(2)) : null;
            result.estimated_currency = currency || null;
            result.ebay_listings_used = prices.length;
          }
        }
      }
    } catch {
      // Non-fatal: still return identification even if eBay fails.
    }

    return NextResponse.json(result);
  } catch (e: unknown) {
    const err = e as Record<string, unknown> | null;
    const message =
      err && typeof err.message === "string"
        ? err.message
        : "Identification failed.";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 }
    );
  }
}
