"use client";

import useSWR from "swr";
import * as React from "react";
import { useSearchParams } from "next/navigation";

import { CardsFilters } from "@/components/cards/CardsFilters";
import { CardsGrid, type CardRow } from "@/components/cards/CardsGrid";
import { CardsPaginationClient } from "@/components/cards/CardsPaginationClient";
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

function CardsGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] justify-items-center gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="grid w-full max-w-[360px] gap-3 rounded-none bg-card p-2"
        >
          <Skeleton className="aspect-[5/7] w-full rounded-none" />
          <div className="grid gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
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

  const key = React.useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (userId) params.set("userId", userId);
    return `/api/cards/search?${params.toString()}`;
  }, [searchParams, userId]);

  const { data, isLoading } = useSWR(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  return (
    <div className="lg:flex lg:gap-6">
      <aside className="hidden lg:block lg:w-[320px] lg:shrink-0 lg:border-r lg:border-border lg:pr-6">
        <div className="sticky h-[calc(100dvh-4rem)] overflow-y-auto py-6">
          <CardsFilters />
        </div>
      </aside>

      <div className="min-w-0 flex-1 py-4">
        <div className="grid gap-6">
          <CardsSearchSort />

          {isLoading ? (
            <CardsGridSkeleton />
          ) : (
            <CardsGrid
              cards={data?.items}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
            />
          )}

          {data ? (
            <CardsPaginationClient
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              hasPrev={data.hasPrev}
              hasNext={data.hasNext}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
