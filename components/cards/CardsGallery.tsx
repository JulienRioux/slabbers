import { CardsGrid } from "@/components/cards/CardsGrid";
import { CardsFilters } from "@/components/cards/CardsFilters";
import { CardsPagination } from "@/components/cards/CardsPagination";
import { CardsSearchSort } from "@/components/cards/CardsSearchSort";
import { getCardsPage, type CardsScope } from "@/lib/cards/getCardsPage";
import {
  normalizeCardsSearchParams,
  type RawSearchParams,
} from "@/lib/cards/searchParams";
import { createClient } from "@/lib/supabase/server";

export async function CardsGallery({
  scope,
  searchParams,
  emptyTitle,
  emptyDescription,
}: {
  scope: CardsScope;
  searchParams: RawSearchParams | null | undefined;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { filters, pagination } = normalizeCardsSearchParams(searchParams);

  const page = await getCardsPage({
    supabase,
    scope,
    viewerId: user?.id ?? null,
    filters,
    pagination,
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

          <CardsGrid
            cards={page.items}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />

          <CardsPagination
            searchParams={searchParams}
            page={page.page}
            pageSize={page.pageSize}
            total={page.total}
            hasPrev={page.hasPrev}
            hasNext={page.hasNext}
          />
        </div>
      </div>
    </div>
  );
}
