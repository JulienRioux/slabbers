"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { buildCardsSearchParams } from "@/lib/cards/searchParams";

export function CardsPaginationClient({
  page,
  pageSize,
  total,
  hasPrev,
  hasNext,
}: {
  page: number;
  pageSize: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const liveParams = useSearchParams();

  const totalPages = React.useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [pageSize, total]
  );

  function goTo(nextPage: number) {
    const base = new URLSearchParams(liveParams.toString());
    const next = buildCardsSearchParams({ base, page: nextPage });
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="outline"
        disabled={!hasPrev}
        onClick={() => {
          if (hasPrev) goTo(page - 1);
        }}
      >
        Prev
      </Button>

      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>

      <Button
        variant="outline"
        disabled={!hasNext}
        onClick={() => {
          if (hasNext) goTo(page + 1);
        }}
      >
        Next
      </Button>
    </div>
  );
}
