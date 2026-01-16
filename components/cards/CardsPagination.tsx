import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildCardsSearchParams,
  type RawSearchParams,
} from "@/lib/cards/searchParams";

export function CardsPagination({
  searchParams,
  page,
  pageSize,
  total,
  hasPrev,
  hasNext,
}: {
  searchParams: RawSearchParams | null | undefined;
  page: number;
  pageSize: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const base = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") base.set(key, value);
      else if (Array.isArray(value) && value[0]) base.set(key, value[0]);
    }
  }

  const prevParams = buildCardsSearchParams({ base, page: page - 1 });
  const nextParams = buildCardsSearchParams({ base, page: page + 1 });

  return (
    <div className="grid gap-2">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {hasPrev ? (
              <PaginationPrevious href={`?${prevParams.toString()}`} />
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "cursor-not-allowed opacity-50"
                )}
                aria-disabled="true"
              >
                Prev
              </span>
            )}
          </PaginationItem>

          <PaginationItem>
            <span
              className={buttonVariants({ variant: "default", size: "sm" })}
              aria-current="page"
            >
              {page}
            </span>
          </PaginationItem>

          <PaginationItem>
            {hasNext ? (
              <PaginationNext href={`?${nextParams.toString()}`} />
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "cursor-not-allowed opacity-50"
                )}
                aria-disabled="true"
              >
                Next
              </span>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <p className="text-center text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
    </div>
  );
}
