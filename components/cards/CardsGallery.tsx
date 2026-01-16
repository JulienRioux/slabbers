import { CardsGrid } from "@/components/cards/CardsGrid";
import { CardsPagination } from "@/components/cards/CardsPagination";
import { CardsFilters } from "@/components/cards/CardsFilters";
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
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
      <div className="hidden w-full max-w-[260px] lg:block">
        <CardsFilters />
      </div>

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
  );
}
