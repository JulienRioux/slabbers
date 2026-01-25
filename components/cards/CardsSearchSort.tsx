"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { CardsFilters } from "@/components/cards/CardsFilters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  buildCardsSearchParams,
  normalizeCardsSearchParams,
  type CardsSort,
} from "@/lib/cards/searchParams";

const SORT_LABEL: Record<CardsSort, string> = {
  price_desc: "Price ↓",
  price_asc: "Price ↑",
  newest: "Newest",
  oldest: "Oldest",
  year_desc: "Year ↓",
  year_asc: "Year ↑",
};

export function CardsSearchSort({
  showSearch = true,
}: {
  showSearch?: boolean;
}) {
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
  const [sort, setSort] = React.useState<CardsSort>(normalized.filters.sort);

  const qDirtyRef = React.useRef(false);

  // Keep local state in sync with URL, but don't overwrite while the user is typing
  // (prevents flicker when debounce + router updates race).
  React.useEffect(() => {
    if (qDirtyRef.current) {
      if (normalized.filters.q === q) {
        qDirtyRef.current = false;
      }
      return;
    }

    setQ(normalized.filters.q);
  }, [normalized.filters.q, q]);

  React.useEffect(() => {
    setSort(normalized.filters.sort);
  }, [normalized.filters.sort]);

  const apply = React.useCallback(
    (next: { q?: string; sort?: CardsSort; page?: number }) => {
      const base = new URLSearchParams(liveParams.toString());
      const params = buildCardsSearchParams({ base, ...next });
      if (params.toString() === base.toString()) return;
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [liveParams, pathname, router]
  );

  React.useEffect(() => {
    if (!showSearch) return;
    if (!qDirtyRef.current) return;
    if (normalized.filters.q === q) return;
    const handle = window.setTimeout(() => {
      apply({ q, page: 1 });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [apply, normalized.filters.q, q, showSearch]);

  return (
    <div
      className={
        showSearch
          ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          : "flex items-center justify-end"
      }
    >
      {showSearch ? (
        <Input
          type="search"
          value={q}
          onChange={(e) => {
            qDirtyRef.current = true;
            setQ(e.target.value);
          }}
          placeholder="Search…"
          className="w-full sm:max-w-md"
        />
      ) : null}

      <div className="flex items-center gap-2">
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

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Filters">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0">
              <SheetHeader className="border-b border-border">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <CardsFilters />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
