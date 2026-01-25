import { CardsGalleryClient } from "@/components/cards/CardsGalleryClient";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/cards/money";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

export default async function UserCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = Boolean(user?.id && user.id === id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,bio")
    .eq("id", id)
    .maybeSingle();

  const username = profile?.username ? String(profile.username) : null;
  const hasDistinctDisplayName = Boolean(
    profile?.display_name &&
      username &&
      String(profile.display_name) !== username
  );

  const displayName =
    profile?.display_name ||
    profile?.username ||
    (isOwner ? "You" : "Collector");

  type CardSummaryRow = {
    price_cents: number | null;
    for_sale: boolean | null;
    is_graded: boolean | null;
  };

  let ownerSummary:
    | {
        totalCards: number;
        totalValueCents: number;
        pricedCount: number;
        forSaleCount: number;
        gradedCount: number;
      }
    | null = null;

  if (isOwner) {
    const { data: cards, count } = await supabase
      .from("cards")
      .select("price_cents,for_sale,is_graded", { count: "exact" })
      .eq("user_id", id)
      .returns<CardSummaryRow[]>();

    const rows = cards ?? [];
    let totalValueCents = 0;
    let pricedCount = 0;
    let forSaleCount = 0;
    let gradedCount = 0;

    for (const card of rows) {
      if (typeof card.price_cents === "number") {
        totalValueCents += card.price_cents;
        pricedCount += 1;
      }
      if (card.for_sale) forSaleCount += 1;
      if (card.is_graded) gradedCount += 1;
    }

    ownerSummary = {
      totalCards: typeof count === "number" ? count : rows.length,
      totalValueCents,
      pricedCount,
      forSaleCount,
      gradedCount,
    };
  }

  return (
    <div className="grid">
      <div className="flex items-start justify-between gap-4 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(profile.avatar_url)}
              alt={displayName}
              className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
            />
          ) : null}

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {displayName}
            </h1>
            {hasDistinctDisplayName ? (
              <p className="mt-1 text-sm text-muted-foreground">@{username}</p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              {profile?.bio
                ? String(profile.bio)
                : isOwner
                ? "Includes your private cards."
                : "Shows public cards in this collection."}
            </p>
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href="/add">
            <IconPlus className="h-4 w-4" />
            Add
          </Link>
        </Button>
      </div>

      {isOwner && ownerSummary ? (
        <div className="grid gap-2 border-b border-border bg-muted/30 px-3 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Collection summary
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-border bg-background p-2">
              <p className="text-[11px] text-muted-foreground">Total cards</p>
              <p className="text-base font-semibold">{ownerSummary.totalCards}</p>
            </div>
            <div className="rounded-md border border-border bg-background p-2">
              <p className="text-[11px] text-muted-foreground">Total value</p>
              <p className="text-base font-semibold">
                {formatMoney({ cents: ownerSummary.totalValueCents })}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {ownerSummary.pricedCount} priced
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-2">
              <p className="text-[11px] text-muted-foreground">For sale</p>
              <p className="text-base font-semibold">
                {ownerSummary.forSaleCount}
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-2">
              <p className="text-[11px] text-muted-foreground">Graded</p>
              <p className="text-base font-semibold">
                {ownerSummary.gradedCount}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <CardsGalleryClient
        userId={id}
        emptyTitle={isOwner ? "No cards in your collection" : "No public cards"}
        emptyDescription={
          isOwner
            ? "Try adjusting your search or filters, or add a card."
            : "Try adjusting your search or filters."
        }
      />
    </div>
  );
}
