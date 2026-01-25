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

export function CardsGalleryClient({
  userId,
  emptyTitle,
  emptyDescription,
}: {
  userId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const searchParams = useSearchParams();

  const baseParams = React.useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (userId) params.set("userId", userId);
    return params.toString();
  }, [searchParams, userId]);


  const getKey = React.useCallback(
    (pageIndex: number, previousPage: CardsPageResult | null) => {
      if (previousPage && !previousPage.hasNext) return null;
      const params = new URLSearchParams(baseParams);
      params.set("page", String(pageIndex + 1));
      return `/api/cards/search?${params.toString()}`;
    },
    [baseParams],
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


  const pages = data ?? [];
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
    if (!node || !hasNext) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNext, loadMore]);

  return (
    <div className="lg:flex lg:gap-6">
      <aside className="hidden lg:block lg:w-[320px] lg:shrink-0 lg:border-r lg:border-border lg:pr-6">
        <div className="sticky h-[calc(100dvh-4rem)] py-6">
          <CardsFilters />
        </div>
      </aside>

      <div className="min-w-0 flex-1 py-4">
        <div className="grid gap-6">
          <CardsSearchSort />

          {isLoading && pages.length === 0 ? (
            <CardsGridSkeleton />
          ) : (
            <CardsGrid
              cards={items}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
            />
          )}

          {isLoadingMore ? <CardsGridSkeleton count={6} /> : null}
          <div ref={sentinelRef} />
        </div>
      </div>
    </div>
  );
}
