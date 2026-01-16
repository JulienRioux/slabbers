"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  buildCardsSearchParams,
  normalizeCardsSearchParams,
  type CardsSort,
} from "@/lib/cards/searchParams";

const SORT_LABEL: Record<CardsSort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  year_desc: "Year ↓",
  year_asc: "Year ↑",
};

export function CardsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const liveParams = useSearchParams();

  const normalized = React.useMemo(
    () =>
      normalizeCardsSearchParams({
        q: liveParams.get("q") ?? undefined,
        forSale: liveParams.get("forSale") ?? undefined,
        graded: liveParams.get("graded") ?? undefined,
        sort: liveParams.get("sort") ?? undefined,
        page: liveParams.get("page") ?? undefined,
        pageSize: liveParams.get("pageSize") ?? undefined,
      }),
    [liveParams]
  );

  const [q, setQ] = React.useState(normalized.filters.q);
  const [forSale, setForSale] = React.useState(normalized.filters.forSale);
  const [graded, setGraded] = React.useState(normalized.filters.graded);
  const [sort, setSort] = React.useState<CardsSort>(normalized.filters.sort);

  React.useEffect(() => {
    setQ(normalized.filters.q);
    setForSale(normalized.filters.forSale);
    setGraded(normalized.filters.graded);
    setSort(normalized.filters.sort);
  }, [
    normalized.filters.q,
    normalized.filters.forSale,
    normalized.filters.graded,
    normalized.filters.sort,
  ]);

  const apply = React.useCallback(
    (next: {
      q?: string;
      forSale?: boolean;
      graded?: boolean;
      sort?: CardsSort;
      page?: number;
      pageSize?: number;
    }) => {
      const base = new URLSearchParams(liveParams.toString());
      const params = buildCardsSearchParams({ base, ...next });
      if (params.toString() === base.toString()) return;
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [liveParams, pathname, router]
  );

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      apply({ q, page: 1 });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [apply, q]);

  return (
    <div className="grid w-full max-w-[300px] gap-3">
      <Input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={forSale}
            onCheckedChange={(checked) => {
              const next = Boolean(checked);
              setForSale(next);
              apply({ forSale: next, page: 1 });
            }}
          />
          For sale
        </label>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={graded}
            onCheckedChange={(checked) => {
              const next = Boolean(checked);
              setGraded(next);
              apply({ graded: next, page: 1 });
            }}
          />
          Graded
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Sort: {SORT_LABEL[sort]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(SORT_LABEL) as CardsSort[]).map((nextSort) => (
              <DropdownMenuItem
                key={nextSort}
                onSelect={(e) => {
                  e.preventDefault();
                  setSort(nextSort);
                  apply({ sort: nextSort, page: 1 });
                }}
              >
                {SORT_LABEL[nextSort]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
