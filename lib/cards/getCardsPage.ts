import type { SupabaseClient } from "@supabase/supabase-js";

import type { CardRow } from "@/components/cards/CardsGrid";
import type { CardsFilters, CardsPagination } from "@/lib/cards/searchParams";

export type CardsScope = { type: "public" } | { type: "user"; userId: string };

export type CardsPageResult = {
  items: CardRow[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type CardDbRow = Omit<CardRow, "owner">;

function escapeIlike(value: string): string {
  // Escape % and _ which are wildcards in LIKE/ILIKE.
  return value.replace(/[%_]/g, (m) => `\\${m}`);
}

function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

const KNOWN_GRADING_COMPANIES = ["PSA", "BGS", "SGC", "CGC", "TAG", "Mint"];

function formatGradeValue(value: number): string {
  const rounded = Math.round(value * 2) / 2;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function gradeValuesForRange(args: {
  min?: number | null;
  max?: number | null;
}): string[] {
  const min = args.min ?? 0;
  const max = args.max ?? 10;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (max < min) return [];

  const start = Math.ceil(min * 2) / 2;
  const end = Math.floor(max * 2) / 2;
  if (end < start) return [];

  const values: string[] = [];
  for (let v = start; v <= end + 1e-9; v += 0.5) {
    values.push(formatGradeValue(v));
  }
  return values;
}

export async function getCardsPage(args: {
  supabase: SupabaseClient;
  scope: CardsScope;
  viewerId: string | null;
  filters: CardsFilters;
  pagination: CardsPagination;
}): Promise<CardsPageResult> {
  const { supabase, scope, viewerId, filters, pagination } = args;

  const page = Math.max(1, Math.trunc(pagination.page));
  const pageSize = Math.max(1, Math.min(60, Math.trunc(pagination.pageSize)));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const baseSelect =
    "id,user_id,is_private,title,year,player,brand,set_name,card_number,image_urls,is_graded,grading_company,grade,rookie,autograph,serial_numbered,print_run,for_sale,price_cents,currency,created_at";

  const run = async (gradeRangeMode: "none" | "number" | "text") => {
    let query = supabase.from("cards").select(baseSelect, { count: "exact" });

    // Scope constraints
    if (scope.type === "public") {
      query = query.eq("is_private", false);
    } else {
      query = query.eq("user_id", scope.userId);
      if (!viewerId || viewerId !== scope.userId) {
        query = query.eq("is_private", false);
      }
    }

    // Filters
    if (filters.forSale) query = query.eq("for_sale", true);

    if (filters.forSale) {
      if (filters.priceMin != null)
        query = query.gte("price_cents", dollarsToCents(filters.priceMin));
      if (filters.priceMax != null)
        query = query.lte("price_cents", dollarsToCents(filters.priceMax));
    }

    if (filters.yearMin != null) query = query.gte("year", filters.yearMin);
    if (filters.yearMax != null) query = query.lte("year", filters.yearMax);

    if (filters.graded) query = query.eq("is_graded", true);
    if (filters.graded && filters.gradingCompany) {
      if (filters.gradingCompany === "Others") {
        query = query
          .not(
            "grading_company",
            "in",
            `(${KNOWN_GRADING_COMPANIES.map((c) => `"${c}"`).join(",")})`
          )
          .not("grading_company", "is", null);
      } else {
        query = query.eq("grading_company", filters.gradingCompany);
      }
    }

    if (filters.graded && gradeRangeMode === "number") {
      if (filters.gradeMin != null)
        query = query.gte("grade_number", filters.gradeMin);
      if (filters.gradeMax != null)
        query = query.lte("grade_number", filters.gradeMax);
    }

    if (filters.graded && gradeRangeMode === "text") {
      const grades = gradeValuesForRange({
        min: filters.gradeMin,
        max: filters.gradeMax,
      });
      if (grades.length > 0) {
        query = query.in("grade", grades);
      }
    }

    if (filters.rookie) query = query.eq("rookie", true);
    if (filters.autograph) query = query.eq("autograph", true);
    if (filters.serialNumbered) query = query.eq("serial_numbered", true);

    if (filters.q) {
      const q = escapeIlike(filters.q);
      const pattern = `%${q}%`;
      query = query.or(
        [
          `title.ilike.${pattern}`,
          `player.ilike.${pattern}`,
          `brand.ilike.${pattern}`,
          `set_name.ilike.${pattern}`,
          `card_number.ilike.${pattern}`,
        ].join(",")
      );
    }

    // Sorting
    if (filters.sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (filters.sort === "year_desc") {
      query = query
        .order("year", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (filters.sort === "year_asc") {
      query = query
        .order("year", { ascending: true })
        .order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    return query.range(from, to);
  };

  const wantsGradeRange =
    filters.graded && (filters.gradeMin != null || filters.gradeMax != null);

  let result = await run(wantsGradeRange ? "number" : "none");

  // If the DB column for grade range filtering hasn't been added yet,
  // fall back to filtering common numeric grade strings ("9", "9.5", "10").
  if (result.error && wantsGradeRange) {
    const err = result.error as unknown as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const msg = String(err?.message ?? "");
    const details = String(err?.details ?? "");
    const hint = String(err?.hint ?? "");
    const combined = `${msg} ${details} ${hint}`.toLowerCase();
    if (combined.includes("grade_number")) {
      result = await run("text");
    }
  }

  const { data: cardsRaw, error, count } = result;

  if (error || !cardsRaw) {
    return {
      items: [],
      page,
      pageSize,
      total: 0,
      hasNext: false,
      hasPrev: page > 1,
    };
  }

  const cards = cardsRaw as unknown as CardDbRow[];

  const total = typeof count === "number" ? count : 0;

  // Attach owner profiles
  const userIds = Array.from(new Set(cards.map((c) => String(c.user_id))));
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .in("id", userIds)
        .returns<ProfileRow[]>()
    : { data: [] as ProfileRow[] };

  const profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));

  const items: CardRow[] = cards.map((c) => ({
    ...c,
    owner: profileById.get(String(c.user_id)) ?? null,
  }));

  const hasPrev = page > 1;
  const hasNext = from + items.length < total;

  return { items, page, pageSize, total, hasNext, hasPrev };
}
