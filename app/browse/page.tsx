import { CardsGalleryClient } from "@/components/cards/CardsGalleryClient";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;

  return (
    <div className="grid gap-6">
      <CardsGalleryClient
        emptyTitle="No cards yet"
        emptyDescription="Try adjusting your search or filters."
      />
    </div>
  );
}
