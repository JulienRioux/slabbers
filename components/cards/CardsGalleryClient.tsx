"use client";

import useSWRInfinite from "swr/infinite";
import * as React from "react";
import { useSearchParams } from "next/navigation";

import { CardsFilters } from "@/components/cards/CardsFilters";
import { CardsGrid, type CardRow } from "@/components/cards/CardsGrid";
import { CardsSearchSort } from "@/components/cards/CardsSearchSort";
import { Skeleton } from "@/components/ui/skeleton";

type CardsPageResult = {
  items: CardRow[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const fetcher = async (url: string): Promise<CardsPageResult> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load cards");
  return res.json();
};

function CardsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid w-full grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-start justify-items-start gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="group relative grid w-full max-w-[240px] gap-3 rounded-none border border-transparent bg-card"
        >
          <Skeleton className="aspect-[5/7] w-full rounded-none" />
          <div className="grid gap-3">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-1">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardsRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex w-full gap-6 overflow-x-auto pb-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="group relative grid w-[220px] shrink-0 gap-3 rounded-none border border-transparent bg-card sm:w-[240px]"
        >
          <Skeleton className="aspect-[5/7] w-full rounded-none" />
          <div className="grid gap-3">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-1">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardsGalleryClient({
  userId,
  emptyTitle,
  emptyDescription,
  pageSize = 24,
  maxPages,
  layout = "grid",
  showFilters = true,
  showSearchSort = true,
  enableInfiniteScroll = true,
}: {
  userId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  maxPages?: number;
  layout?: "grid" | "row";
  showFilters?: boolean;
  showSearchSort?: boolean;
  enableInfiniteScroll?: boolean;
}) {
  const searchParams = useSearchParams();

  const baseParams = React.useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("pageSize", String(pageSize));
    if (userId) params.set("userId", userId);
    return params.toString();
  }, [pageSize, searchParams, userId]);

  const getKey = React.useCallback(
    (pageIndex: number, previousPage: CardsPageResult | null) => {
      if (maxPages && pageIndex >= maxPages) return null;
      if (previousPage && !previousPage.hasNext) return null;
      const params = new URLSearchParams(baseParams);
      params.set("page", String(pageIndex + 1));
      return `/api/cards/search?${params.toString()}`;
    },
    [baseParams, maxPages],
  );

  const { data, isLoading, isValidating, size, setSize } = useSWRInfinite(
    getKey,
    fetcher,
    {
      keepPreviousData: true,
      persistSize: true,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    },
  );

  const pages = React.useMemo(() => data ?? [], [data]);
  const items = React.useMemo(
    () => pages.flatMap((page) => page.items),
    [pages],
  );
  const lastPage = pages[pages.length - 1];
  const hasNext = lastPage?.hasNext ?? false;
  const isLoadingMore = isValidating && size > 0 && pages.length > 0;

  const loadMore = React.useCallback(() => {
    if (!hasNext || isLoadingMore) return;
    setSize(size + 1);
  }, [hasNext, isLoadingMore, setSize, size]);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!enableInfiniteScroll || !node || !hasNext) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enableInfiniteScroll, hasNext, loadMore]);

  return (
    <div className="lg:flex lg:gap-6">
      {showFilters ? (
        <aside className="hidden lg:block lg:w-[320px] lg:shrink-0 lg:border-r lg:border-border lg:pr-6">
          <div className="sticky top-16 h-[calc(100dvh-6rem)] overflow-y-auto pr-2">
            <CardsFilters />
          </div>
        </aside>
      ) : null}

      <div className="min-w-0 flex-1 py-4">
        <div className="grid gap-6">
          {showSearchSort ? <CardsSearchSort /> : null}

          {isLoading && pages.length === 0 ? (
            layout === "row" ? (
              <CardsRowSkeleton />
            ) : (
              <CardsGridSkeleton />
            )
          ) : (
            <CardsGrid
              cards={items}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              layout={layout}
            />
          )}

          {isLoadingMore ? (
            layout === "row" ? (
              <CardsRowSkeleton count={6} />
            ) : (
              <CardsGridSkeleton count={6} />
            )
          ) : null}
          {enableInfiniteScroll ? <div ref={sentinelRef} /> : null}
        </div>
      </div>
    </div>
  );
}
