import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/cards/money";

export type CardRow = {
  id: string;
  user_id: string;
  owner?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  is_private: boolean;
  title: string;
  year: number;
  player: string;
  brand: string;
  set_name?: string | null;
  card_number?: string | null;
  image_urls: string[];
  created_at?: string;
  is_graded: boolean;
  grading_company: string | null;
  grade: string | null;
  rookie: boolean;
  autograph: boolean;
  serial_numbered: boolean;
  print_run: number | null;
  for_sale: boolean;
  price_cents: number | null;
  currency: string | null;
};

export function CardsGrid({
  cards,
  emptyTitle = "No cards yet",
  emptyDescription = "Add the first card to start the gallery.",
}: {
  cards: CardRow[] | null | undefined;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!cards || cards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{emptyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start justify-items-center gap-6">
      {cards.map((card) => {
        const image = card.image_urls?.[0];
        const fallbackLabel = card.user_id ? card.user_id.slice(0, 8) : "";
        const ownerLabel = card.owner?.username || fallbackLabel;
        const hasPrice = Boolean(card.for_sale && card.price_cents);
        return (
          <div
            key={card.id}
            className="group relative grid w-full max-w-[360px] gap-3 rounded-none border border-transparent bg-card p-2 transition-colors hover:border-border"
          >
            <Link
              href={`/card/${card.id}`}
              aria-label={card.title}
              className="absolute inset-0 rounded-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />

            <div className="pointer-events-none">
              {image ? (
                // Using <img> avoids Next Image remotePatterns config for Supabase URLs.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={card.title}
                  className="aspect-[5/7] w-full rounded-none object-cover"
                />
              ) : (
                <div className="flex aspect-[5/7] items-center justify-center rounded-none bg-card text-sm text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            <div className="pointer-events-none grid gap-3">
              <h3 className="text-lg font-semibold leading-snug text-foreground">
                {card.title}
              </h3>

              {hasPrice ? (
                <div className="flex items-baseline gap-3">
                  <p className="text-md font-semibold tracking-tight">
                    {formatMoney({
                      cents: card.price_cents as number,
                      currency: card.currency ?? "CAD",
                    })}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/user/${card.user_id}`}
                  className="pointer-events-auto inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground/75 hover:text-foreground transition-colors"
                >
                  {card.owner?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.owner.avatar_url}
                      alt={ownerLabel}
                      className="h-5 w-5 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : null}
                  <span className="truncate">{ownerLabel}</span>
                </Link>

                <div className="flex flex-wrap justify-end gap-1">
                  {card.is_private ? (
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      Private
                    </Badge>
                  ) : null}
                  {card.is_graded && card.grading_company && card.grade ? (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {card.grading_company} {card.grade}
                    </Badge>
                  ) : null}
                  {card.rookie ? (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      Rookie
                    </Badge>
                  ) : null}
                  {card.autograph ? (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      Auto
                    </Badge>
                  ) : null}
                  {card.serial_numbered && card.print_run ? (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      /{card.print_run}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
