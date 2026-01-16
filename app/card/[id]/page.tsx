import { notFound } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/cards/money";
import { CardActionsDropdown } from "@/app/card/[id]/CardActionsDropdown";
import { CardImageCarousel } from "@/app/card/[id]/CardImageCarousel";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: card, error } = await supabase
    .from("cards")
    .select(
      "id,user_id,is_private,title,year,player,brand,set_name,card_number,is_graded,grading_company,grade,rookie,autograph,serial_numbered,print_run,for_sale,price_cents,currency,image_urls,created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !card) {
    notFound();
  }

  const images: string[] = Array.isArray(card.image_urls)
    ? (card.image_urls as string[])
    : [];
  const isOwner = Boolean(user?.id && user.id === card.user_id);

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .eq("id", card.user_id)
    .maybeSingle();

  const ownerLabel = ownerProfile?.username || String(card.user_id).slice(0, 8);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 py-8 lg:grid-cols-2">
      <div className="grid gap-4">
        <CardImageCarousel images={images} title={card.title} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="min-w-0">{card.title}</CardTitle>
            {isOwner ? <CardActionsDropdown cardId={card.id} /> : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {card.is_private ? (
              <Badge variant="outline">Private</Badge>
            ) : (
              <Badge variant="outline">Public</Badge>
            )}
            {card.is_graded && card.grading_company && card.grade ? (
              <Badge variant="secondary">
                {card.grading_company} {card.grade}
              </Badge>
            ) : null}
            {card.rookie ? <Badge variant="secondary">Rookie</Badge> : null}
            {card.autograph ? <Badge variant="secondary">Auto</Badge> : null}
            {card.serial_numbered && card.print_run ? (
              <Badge variant="secondary">/{card.print_run}</Badge>
            ) : null}
            {card.for_sale ? (
              <Badge>For sale</Badge>
            ) : (
              <Badge variant="outline">Not for sale</Badge>
            )}
          </div>

          {card.for_sale && card.price_cents ? (
            <p className="text-lg font-semibold">
              {formatMoney({
                cents: card.price_cents,
                currency: card.currency ?? "CAD",
              })}
            </p>
          ) : null}

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="font-medium">
                <Link
                  href={`/user/${card.user_id}`}
                  className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors"
                >
                  {ownerProfile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={String(ownerProfile.avatar_url)}
                      alt={ownerLabel}
                      className="h-5 w-5 rounded-full border border-border object-cover"
                    />
                  ) : null}
                  {ownerLabel}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Year</dt>
              <dd className="font-medium">{card.year}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Player</dt>
              <dd className="font-medium">{card.player}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Brand</dt>
              <dd className="font-medium">{card.brand}</dd>
            </div>
            {card.set_name ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Set</dt>
                <dd className="font-medium">{card.set_name}</dd>
              </div>
            ) : null}
            {card.card_number ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Card #</dt>
                <dd className="font-medium">{card.card_number}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
