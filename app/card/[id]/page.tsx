import { notFound } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

      <Card className="overflow-hidden rounded-none py-0 shadow-none">
        {/* Trading-card back style: strip header, boxed facts, strip footer */}
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold leading-tight">
                {card.title}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {[
                  card.year ? String(card.year) : null,
                  card.brand ? String(card.brand) : null,
                  card.set_name ? String(card.set_name) : null,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            </div>
            {isOwner ? <CardActionsDropdown cardId={card.id} /> : null}
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6">
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
            <div className="rounded-none border border-border bg-muted/20 px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Price
              </div>
              <div className="mt-1 text-xl font-semibold">
                {formatMoney({
                  cents: card.price_cents,
                  currency: card.currency ?? "CAD",
                })}
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-none border border-border">
            <div className="border-b border-border bg-muted/20 px-4 py-2">
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Card Data
              </div>
            </div>

            <dl className="grid gap-0 text-sm">
              <div className="grid grid-cols-[7rem_1fr] items-center gap-4 px-4 py-3">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Owner
                </dt>
                <dd className="min-w-0 text-right font-medium">
                  <Link
                    href={`/user/${card.user_id}`}
                    className="inline-flex max-w-full items-center justify-end gap-2 underline underline-offset-4 decoration-border/80 hover:decoration-foreground"
                  >
                    {ownerProfile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={String(ownerProfile.avatar_url)}
                        alt={ownerLabel}
                        className="h-5 w-5 rounded-full border border-border object-cover"
                      />
                    ) : null}
                    <span className="truncate">@{ownerLabel}</span>
                  </Link>
                </dd>
              </div>

              <div className="border-t border-border" />

              <div className="grid grid-cols-[7rem_1fr] items-center gap-4 px-4 py-3">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Player
                </dt>
                <dd className="text-right font-medium">{card.player}</dd>
              </div>

              <div className="border-t border-border" />

              <div className="grid grid-cols-[7rem_1fr] items-center gap-4 px-4 py-3">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Year
                </dt>
                <dd className="text-right font-medium">{card.year}</dd>
              </div>

              <div className="border-t border-border" />

              <div className="grid grid-cols-[7rem_1fr] items-center gap-4 px-4 py-3">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Brand
                </dt>
                <dd className="text-right font-medium">{card.brand}</dd>
              </div>

              {card.set_name ? (
                <>
                  <div className="border-t border-border" />
                  <div className="grid grid-cols-[7rem_1fr] items-center gap-4 px-4 py-3">
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Set
                    </dt>
                    <dd className="text-right font-medium">{card.set_name}</dd>
                  </div>
                </>
              ) : null}

              {card.card_number ? (
                <>
                  <div className="border-t border-border" />
                  <div className="grid grid-cols-[7rem_1fr] items-center gap-4 px-4 py-3">
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Card #
                    </dt>
                    <dd className="text-right font-medium">
                      {card.card_number}
                    </dd>
                  </div>
                </>
              ) : null}

              {card.serial_numbered ? (
                <>
                  <div className="border-t border-border" />
                  <div className="grid grid-cols-[7rem_1fr] items-center gap-4 px-4 py-3">
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Serial
                    </dt>
                    <dd className="text-right font-medium">
                      {card.print_run ? `/${card.print_run}` : "Yes"}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          </div>
        </div>

        <div className="border-t border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="min-w-0 truncate">ID • {card.id}</div>
            <div className="shrink-0">
              {card.is_graded && card.grading_company && card.grade
                ? `${card.grading_company} ${card.grade}`
                : "Raw"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
