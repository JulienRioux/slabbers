import { CardsGalleryClient } from "@/components/cards/CardsGalleryClient";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
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
