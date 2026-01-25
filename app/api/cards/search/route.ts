import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getCardsPage } from "@/lib/cards/getCardsPage";
import type { CardsSort } from "@/lib/cards/searchParams";

function parseBool1(value: string | null): boolean {
  return value === "1";
}

function parseBoolDefaultTrue(value: string | null): boolean {
  if (value == null) return true;
  return value !== "0";
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

function parseOptionalNonNegativeInt(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

function parseOptionalNonNegativeFloat(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseOptionalTrimmedString(value: string | null): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function parseSort(value: string | null): CardsSort {
  if (value === "price_desc") return "price_desc";
  if (value === "price_asc") return "price_asc";
  if (value === "newest") return "newest";
  if (value === "oldest") return "oldest";
  if (value === "year_desc") return "year_desc";
  if (value === "year_asc") return "year_asc";
  return "price_desc";
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const q = (url.searchParams.get("q") ?? "").trim();
  const forSale = parseBoolDefaultTrue(url.searchParams.get("forSale"));
  const graded = parseBool1(url.searchParams.get("graded"));

  const priceMin = parseOptionalNonNegativeFloat(
    url.searchParams.get("price_min")
  );
  const priceMax = parseOptionalNonNegativeFloat(
    url.searchParams.get("price_max")
  );

  const yearMin = parseOptionalNonNegativeInt(url.searchParams.get("year_min"));
  const yearMax = parseOptionalNonNegativeInt(url.searchParams.get("year_max"));

  const gradingCompany = parseOptionalTrimmedString(
    url.searchParams.get("grading_company")
  );

  const gradeMin = parseOptionalNonNegativeFloat(
    url.searchParams.get("grade_min")
  );
  const gradeMax = parseOptionalNonNegativeFloat(
    url.searchParams.get("grade_max")
  );

  const rookie = parseBool1(url.searchParams.get("rookie"));
  const autograph = parseBool1(url.searchParams.get("autograph"));
  const serialNumbered = parseBool1(url.searchParams.get("serial_numbered"));

  const sort = parseSort(url.searchParams.get("sort"));

  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSizeRaw = parsePositiveInt(url.searchParams.get("pageSize"), 24);
  const pageSize = Math.max(1, Math.min(60, pageSizeRaw));

  const userId = url.searchParams.get("userId");
  const scope = userId
    ? { type: "user" as const, userId }
    : { type: "public" as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await getCardsPage({
    supabase,
    scope,
    viewerId: user?.id ?? null,
    filters: {
      q,
      forSale,
      graded,
      priceMin,
      priceMax,
      yearMin,
      yearMax,
      gradingCompany,
      gradeMin,
      gradeMax,
      rookie,
      autograph,
      serialNumbered,
      sort,
    },
    pagination: { page, pageSize },
  });

  return NextResponse.json(result);
}
