import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="w-full px-6 py-16">
      <div className="flex flex-col gap-10 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col items-start gap-6 md:justify-center">
          <div className="grid gap-3">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              <span className="block whitespace-nowrap">Collect smarter.</span>
              <span className="block whitespace-nowrap">Enjoy the chase.</span>
            </h1>

            <p className="text-base text-muted-foreground md:whitespace-nowrap">
              Catalog, track, and browse collectible cards—without the clutter.
            </p>

            <p className="text-sm text-muted-foreground md:whitespace-nowrap">
              Build a polished collection page, keep grade/condition/notes
              organized, and add your next favorite.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/browse">Browse cards</Link>
            </Button>

            {user ? (
              <Button asChild variant="outline">
                <Link href="/add">Add a card</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/login">Sign in to start</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <div className="mx-auto aspect-[5/7] w-full max-w-[360px] overflow-hidden rounded-none md:ml-auto md:mr-0">
            <img
              src="https://images.unsplash.com/photo-1620160573323-cfb0028e1cdb?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Collectible card display"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
