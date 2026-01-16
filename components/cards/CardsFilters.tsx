"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildCardsSearchParams,
  normalizeCardsSearchParams,
} from "@/lib/cards/searchParams";

const GRADING_COMPANIES = [
  "PSA",
  "BGS",
  "SGC",
  "CGC",
  "TAG",
  "Mint",
  "Others",
] as const;

const ANY_VALUE = "__any__";

const GRADE_OPTIONS = Array.from({ length: 19 }, (_, idx) => {
  const value = 1 + idx * 0.5;
  return Number.isInteger(value) ? String(value) : String(value);
});

function toOptionalNonNegativeFloatOrNull(
  input: string
): number | null | undefined {
  const s = input.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function toOptionalNonNegativeIntOrNull(
  input: string
): number | null | undefined {
  const s = input.trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.trunc(n);
}

export function CardsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const liveParams = useSearchParams();

  const normalized = React.useMemo(
    () =>
      normalizeCardsSearchParams({
        q: liveParams.get("q") ?? undefined,
        forSale: liveParams.get("forSale") ?? undefined,
        graded: liveParams.get("graded") ?? undefined,
        price_min: liveParams.get("price_min") ?? undefined,
        price_max: liveParams.get("price_max") ?? undefined,
        year_min: liveParams.get("year_min") ?? undefined,
        year_max: liveParams.get("year_max") ?? undefined,
        grading_company: liveParams.get("grading_company") ?? undefined,
        grade_min: liveParams.get("grade_min") ?? undefined,
        grade_max: liveParams.get("grade_max") ?? undefined,
        rookie: liveParams.get("rookie") ?? undefined,
        autograph: liveParams.get("autograph") ?? undefined,
        serial_numbered: liveParams.get("serial_numbered") ?? undefined,
        sort: liveParams.get("sort") ?? undefined,
        page: liveParams.get("page") ?? undefined,
        pageSize: liveParams.get("pageSize") ?? undefined,
      }),
    [liveParams]
  );

  const [forSale, setForSale] = React.useState(normalized.filters.forSale);
  const [priceMin, setPriceMin] = React.useState(
    normalized.filters.priceMin != null
      ? String(normalized.filters.priceMin)
      : ""
  );
  const [priceMax, setPriceMax] = React.useState(
    normalized.filters.priceMax != null
      ? String(normalized.filters.priceMax)
      : ""
  );

  const [yearMin, setYearMin] = React.useState(
    normalized.filters.yearMin != null ? String(normalized.filters.yearMin) : ""
  );
  const [yearMax, setYearMax] = React.useState(
    normalized.filters.yearMax != null ? String(normalized.filters.yearMax) : ""
  );

  const [graded, setGraded] = React.useState(normalized.filters.graded);

  const [gradingCompany, setGradingCompany] = React.useState(
    normalized.filters.gradingCompany ?? ANY_VALUE
  );
  const [gradeMin, setGradeMin] = React.useState(
    normalized.filters.gradeMin != null
      ? String(normalized.filters.gradeMin)
      : ANY_VALUE
  );
  const [gradeMax, setGradeMax] = React.useState(
    normalized.filters.gradeMax != null
      ? String(normalized.filters.gradeMax)
      : ANY_VALUE
  );

  const [rookie, setRookie] = React.useState(normalized.filters.rookie);
  const [autograph, setAutograph] = React.useState(
    normalized.filters.autograph
  );
  const [serialNumbered, setSerialNumbered] = React.useState(
    normalized.filters.serialNumbered
  );

  React.useEffect(() => {
    setForSale(normalized.filters.forSale);
    setPriceMin(
      normalized.filters.priceMin != null
        ? String(normalized.filters.priceMin)
        : ""
    );
    setPriceMax(
      normalized.filters.priceMax != null
        ? String(normalized.filters.priceMax)
        : ""
    );
    setYearMin(
      normalized.filters.yearMin != null
        ? String(normalized.filters.yearMin)
        : ""
    );
    setYearMax(
      normalized.filters.yearMax != null
        ? String(normalized.filters.yearMax)
        : ""
    );
    setGraded(normalized.filters.graded);
    setGradingCompany(normalized.filters.gradingCompany ?? ANY_VALUE);
    setGradeMin(
      normalized.filters.gradeMin != null
        ? String(normalized.filters.gradeMin)
        : ANY_VALUE
    );
    setGradeMax(
      normalized.filters.gradeMax != null
        ? String(normalized.filters.gradeMax)
        : ANY_VALUE
    );
    setRookie(normalized.filters.rookie);
    setAutograph(normalized.filters.autograph);
    setSerialNumbered(normalized.filters.serialNumbered);
  }, [
    normalized.filters.forSale,
    normalized.filters.priceMin,
    normalized.filters.priceMax,
    normalized.filters.yearMin,
    normalized.filters.yearMax,
    normalized.filters.graded,
    normalized.filters.gradingCompany,
    normalized.filters.gradeMin,
    normalized.filters.gradeMax,
    normalized.filters.rookie,
    normalized.filters.autograph,
    normalized.filters.serialNumbered,
  ]);

  const apply = React.useCallback(
    (next: {
      forSale?: boolean;
      priceMin?: number | null;
      priceMax?: number | null;
      yearMin?: number | null;
      yearMax?: number | null;
      graded?: boolean;
      gradingCompany?: string | null;
      gradeMin?: number | null;
      gradeMax?: number | null;
      rookie?: boolean;
      autograph?: boolean;
      serialNumbered?: boolean;
    }) => {
      const base = new URLSearchParams(liveParams.toString());
      const params = buildCardsSearchParams({ base, ...next, page: 1 });
      if (params.toString() === base.toString()) return;
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [liveParams, pathname, router]
  );

  const hasActiveFilters = React.useMemo(() => {
    const f = normalized.filters;
    return !(
      f.forSale === true &&
      f.priceMin == null &&
      f.priceMax == null &&
      f.yearMin == null &&
      f.yearMax == null &&
      f.graded === false &&
      f.gradingCompany == null &&
      f.gradeMin == null &&
      f.gradeMax == null &&
      f.rookie === false &&
      f.autograph === false &&
      f.serialNumbered === false
    );
  }, [normalized.filters]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <p className="text-xs font-medium text-muted-foreground">Sale</p>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={forSale}
            onCheckedChange={(checked) => {
              const next = Boolean(checked);
              setForSale(next);
              if (!next) {
                apply({ forSale: false, priceMin: null, priceMax: null });
              } else {
                apply({ forSale: true });
              }
            }}
          />
          For sale
        </label>

        {forSale ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <p className="text-xs text-muted-foreground">Price min</p>
              <Input
                inputMode="decimal"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                onBlur={() => {
                  const parsed = toOptionalNonNegativeFloatOrNull(priceMin);
                  if (parsed === undefined) return;
                  apply({ priceMin: parsed });
                }}
                placeholder="0"
              />
            </div>

            <div className="grid gap-1">
              <p className="text-xs text-muted-foreground">Price max</p>
              <Input
                inputMode="decimal"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                onBlur={() => {
                  const parsed = toOptionalNonNegativeFloatOrNull(priceMax);
                  if (parsed === undefined) return;
                  apply({ priceMax: parsed });
                }}
                placeholder="0"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-medium text-muted-foreground">Year</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <p className="text-xs text-muted-foreground">From</p>
            <Input
              inputMode="numeric"
              value={yearMin}
              onChange={(e) => setYearMin(e.target.value)}
              onBlur={() => {
                const parsed = toOptionalNonNegativeIntOrNull(yearMin);
                if (parsed === undefined) return;
                apply({ yearMin: parsed });
              }}
              placeholder="e.g. 1996"
            />
          </div>
          <div className="grid gap-1">
            <p className="text-xs text-muted-foreground">To</p>
            <Input
              inputMode="numeric"
              value={yearMax}
              onChange={(e) => setYearMax(e.target.value)}
              onBlur={() => {
                const parsed = toOptionalNonNegativeIntOrNull(yearMax);
                if (parsed === undefined) return;
                apply({ yearMax: parsed });
              }}
              placeholder="e.g. 2020"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <p className="text-xs font-medium text-muted-foreground">Grading</p>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={graded}
            onCheckedChange={(checked) => {
              const next = Boolean(checked);
              setGraded(next);
              if (!next) {
                apply({
                  graded: false,
                  gradingCompany: null,
                  gradeMin: null,
                  gradeMax: null,
                });
              } else {
                apply({ graded: true });
              }
            }}
          />
          Graded only
        </label>

        {graded ? (
          <div className="grid gap-2">
            <div className="grid gap-1">
              <p className="text-xs text-muted-foreground">Company</p>
              <Select
                value={gradingCompany}
                onValueChange={(next) => {
                  setGradingCompany(next);
                  apply({ gradingCompany: next === ANY_VALUE ? null : next });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>Any</SelectItem>
                  {GRADING_COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">Grade min</p>
                <Select
                  value={gradeMin}
                  onValueChange={(next) => {
                    setGradeMin(next);
                    if (next === ANY_VALUE) {
                      apply({ gradeMin: null });
                      return;
                    }
                    const parsed = toOptionalNonNegativeFloatOrNull(next);
                    if (parsed === undefined) return;
                    apply({ gradeMin: parsed });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_VALUE}>Any</SelectItem>
                    {GRADE_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">Grade max</p>
                <Select
                  value={gradeMax}
                  onValueChange={(next) => {
                    setGradeMax(next);
                    if (next === ANY_VALUE) {
                      apply({ gradeMax: null });
                      return;
                    }
                    const parsed = toOptionalNonNegativeFloatOrNull(next);
                    if (parsed === undefined) return;
                    apply({ gradeMax: parsed });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_VALUE}>Any</SelectItem>
                    {GRADE_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        <p className="text-xs font-medium text-muted-foreground">Attributes</p>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={rookie}
            onCheckedChange={(checked) => {
              const next = Boolean(checked);
              setRookie(next);
              apply({ rookie: next });
            }}
          />
          Rookie
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={autograph}
            onCheckedChange={(checked) => {
              const next = Boolean(checked);
              setAutograph(next);
              apply({ autograph: next });
            }}
          />
          Autograph
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={serialNumbered}
            onCheckedChange={(checked) => {
              const next = Boolean(checked);
              setSerialNumbered(next);
              apply({ serialNumbered: next });
            }}
          />
          Serial numbered
        </label>
      </div>

      {hasActiveFilters ? (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              apply({
                forSale: true,
                priceMin: null,
                priceMax: null,
                yearMin: null,
                yearMax: null,
                graded: false,
                gradingCompany: null,
                gradeMin: null,
                gradeMax: null,
                rookie: false,
                autograph: false,
                serialNumbered: false,
              });
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
