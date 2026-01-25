import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

import { CardsGalleryClient } from "@/components/cards/CardsGalleryClient";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
        <div className="flex flex-col items-start gap-6 md:justify-center">
          <div className="grid gap-3">
            <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
              <span className="block whitespace-nowrap">Collect smarter.</span>
              <span className="block whitespace-nowrap">Enjoy the chase.</span>
            </h1>

            <p className="text-lg text-muted-foreground ">
              Catalog, track, and browse collectible cards—without the clutter.
              Build a polished collection page, keep grade/condition/notes
              organized, and add your next favorite.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/browse">Browse cards</Link>
            </Button>

            {user ? (
              <Button asChild size="lg" variant="outline">
                <Link href="/add">Add a card</Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in to start</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="w-full">
          <div className="mx-auto aspect-[1/1] w-full overflow-hidden rounded-none md:ml-auto md:mr-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1620160573323-cfb0028e1cdb?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Collectible card display"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>

      <section className="mt-14 grid gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Latest additions
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link href="/browse">View all</Link>
          </Button>
        </div>

        <CardsGalleryClient
          emptyTitle="No cards yet"
          emptyDescription="Be the first to add a card."
          pageSize={8}
          maxPages={1}
          layout="row"
          showFilters={false}
          showSearchSort={false}
          enableInfiniteScroll={false}
        />
      </section>

      <footer className="mt-16 border-t border-border/60 bg-muted/30">
        <div className="grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <Link href="/" className="text-lg font-semibold text-foreground">
              Slabbers
            </Link>
            <p className="max-w-md text-sm text-muted-foreground">
              Catalog, track, and showcase your favorite cards in a clean,
              collector-first experience.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="sm">
                <Link href="/browse">Browse cards</Link>
              </Button>
              {user ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/add">Add a card</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2 text-sm">
              <p className="font-medium text-foreground">Explore</p>
              <Link
                href="/browse"
                className="text-muted-foreground hover:text-foreground"
              >
                Browse cards
              </Link>
              {user ? (
                <Link
                  href="/add"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Add a card
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
              )}
            </div>
            <div className="grid gap-2 text-sm">
              <p className="font-medium text-foreground">Highlights</p>
              <p className="text-muted-foreground">Community curated</p>
              <p className="text-muted-foreground">Modern collection tools</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/60 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Slabbers. All rights reserved.</p>
          <p>Built for collectors who love the chase.</p>
        </div>
      </footer>
    </div>
  );
}
