export type CardsSort = "newest" | "oldest" | "year_desc" | "year_asc";

export type CardsFilters = {
  q: string;
  forSale: boolean;
  graded: boolean;
  priceMin: number | null;
  priceMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  gradingCompany: string | null;
  gradeMin: number | null;
  gradeMax: number | null;
  rookie: boolean;
  autograph: boolean;
  serialNumbered: boolean;
  sort: CardsSort;
};

export type CardsPagination = {
  page: number;
  pageSize: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function firstString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
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
  if (value === "newest") return "newest";
  if (value === "oldest") return "oldest";
  if (value === "year_desc") return "year_desc";
  if (value === "year_asc") return "year_asc";
  return "newest";
}

export function normalizeCardsSearchParams(
  searchParams: RawSearchParams | null | undefined
): { filters: CardsFilters; pagination: CardsPagination } {
  const q = (firstString(searchParams?.q) ?? "").trim();
  const forSaleRaw = firstString(searchParams?.forSale);
  const forSale = forSaleRaw == null ? true : forSaleRaw !== "0";
  const graded = firstString(searchParams?.graded) === "1";

  const priceMin = parseOptionalNonNegativeFloat(
    firstString(searchParams?.["price_min"])
  );
  const priceMax = parseOptionalNonNegativeFloat(
    firstString(searchParams?.["price_max"])
  );

  const yearMin = parseOptionalNonNegativeInt(
    firstString(searchParams?.["year_min"])
  );
  const yearMax = parseOptionalNonNegativeInt(
    firstString(searchParams?.["year_max"])
  );

  const gradingCompany = parseOptionalTrimmedString(
    firstString(searchParams?.["grading_company"])
  );

  const gradeMin = parseOptionalNonNegativeFloat(
    firstString(searchParams?.["grade_min"])
  );
  const gradeMax = parseOptionalNonNegativeFloat(
    firstString(searchParams?.["grade_max"])
  );

  const rookie = firstString(searchParams?.["rookie"]) === "1";
  const autograph = firstString(searchParams?.["autograph"]) === "1";
  const serialNumbered = firstString(searchParams?.["serial_numbered"]) === "1";

  const sort = parseSort(firstString(searchParams?.sort));

  const page = parsePositiveInt(firstString(searchParams?.page), 1);
  const pageSizeRaw = parsePositiveInt(firstString(searchParams?.pageSize), 24);
  const pageSize = Math.max(1, Math.min(60, pageSizeRaw));

  return {
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
  };
}

export function buildCardsSearchParams(next: {
  q?: string;
  forSale?: boolean;
  graded?: boolean;
  priceMin?: number | null;
  priceMax?: number | null;
  yearMin?: number | null;
  yearMax?: number | null;
  gradingCompany?: string | null;
  gradeMin?: number | null;
  gradeMax?: number | null;
  rookie?: boolean;
  autograph?: boolean;
  serialNumbered?: boolean;
  sort?: CardsSort;
  page?: number;
  pageSize?: number;
  base?: URLSearchParams;
}): URLSearchParams {
  const params = new URLSearchParams(next.base?.toString() ?? "");

  if (next.q !== undefined) {
    const q = next.q.trim();
    if (q) params.set("q", q);
    else params.delete("q");
  }

  if (next.forSale !== undefined) {
    // Default is ON. We only encode OFF explicitly.
    if (next.forSale) params.delete("forSale");
    else params.set("forSale", "0");
  }

  if (next.graded !== undefined) {
    if (next.graded) params.set("graded", "1");
    else params.delete("graded");
  }

  if (next.priceMin !== undefined) {
    if (next.priceMin == null) params.delete("price_min");
    else params.set("price_min", String(next.priceMin));
  }

  if (next.priceMax !== undefined) {
    if (next.priceMax == null) params.delete("price_max");
    else params.set("price_max", String(next.priceMax));
  }

  if (next.yearMin !== undefined) {
    if (next.yearMin == null) params.delete("year_min");
    else params.set("year_min", String(next.yearMin));
  }

  if (next.yearMax !== undefined) {
    if (next.yearMax == null) params.delete("year_max");
    else params.set("year_max", String(next.yearMax));
  }

  if (next.gradingCompany !== undefined) {
    const s = String(next.gradingCompany ?? "").trim();
    if (!s) params.delete("grading_company");
    else params.set("grading_company", s);
  }

  if (next.gradeMin !== undefined) {
    if (next.gradeMin == null) params.delete("grade_min");
    else params.set("grade_min", String(next.gradeMin));
  }

  if (next.gradeMax !== undefined) {
    if (next.gradeMax == null) params.delete("grade_max");
    else params.set("grade_max", String(next.gradeMax));
  }

  if (next.rookie !== undefined) {
    if (next.rookie) params.set("rookie", "1");
    else params.delete("rookie");
  }

  if (next.autograph !== undefined) {
    if (next.autograph) params.set("autograph", "1");
    else params.delete("autograph");
  }

  if (next.serialNumbered !== undefined) {
    if (next.serialNumbered) params.set("serial_numbered", "1");
    else params.delete("serial_numbered");
  }

  if (next.sort !== undefined) {
    if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
    else params.delete("sort");
  }

  if (next.page !== undefined) {
    if (next.page && next.page > 1) params.set("page", String(next.page));
    else params.delete("page");
  }

  if (next.pageSize !== undefined) {
    if (next.pageSize && next.pageSize !== 24)
      params.set("pageSize", String(next.pageSize));
    else params.delete("pageSize");
  }

  return params;
}
