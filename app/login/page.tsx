import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    email?: string;
    error?: string;
    next?: string;
  }>;
}) {
  const { sent, email, error, next } = await searchParams;

  async function sendMagicLink(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const next = String(formData.get("next") ?? "").trim();

    if (!email) {
      return;
    }

    const origin = (await headers()).get("origin") ?? "";
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback${
          next ? `?next=${encodeURIComponent(next)}` : ""
        }`,
      },
    });

    // We always redirect back to /login so we don't leak auth state in a RSC render.
    const params = new URLSearchParams();
    if (error) params.set("error", "1");
    else params.set("sent", "1");
    params.set("email", email);
    if (next) params.set("next", next);

    redirect(`/login?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Get a magic link by email. No password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={sendMagicLink} className="grid gap-4">
            <input type="hidden" name="next" value={next ?? ""} />
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={email ?? ""}
                required
              />
            </div>

            {sent === "1" ? (
              <p className="text-sm text-muted-foreground">
                Magic link sent to{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </p>
            ) : null}
            {error === "1" ? (
              <p className="text-sm text-destructive">
                Couldn’t send the magic link. Check your Supabase env vars.
              </p>
            ) : null}

            <Button type="submit">Send magic link</Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
