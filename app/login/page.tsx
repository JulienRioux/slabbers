import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { MagicLinkForm } from "./magic-link-form";

type SearchParams = {
  sent?: string;
  email?: string;
  error?: string;
  error_message?: string;
  next?: string;
};

function normalizeBaseUrl(raw: string) {
  let v = (raw ?? "").trim();
  if (!v) return "";

  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  v = v.replace(/\/+$/, "");
  return v;
}

async function pickBaseUrlFromHeaders() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/+$/, "");
  }
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const isLocalHost = host.includes("localhost") || host.includes("127.0.0.1");
  const proto = h.get("x-forwarded-proto") ?? (isLocalHost ? "http" : "https");
  return `${proto}://${host}`.replace(/\/+$/, "");
}

async function getBaseUrl() {
  const envSite = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "");

  const isProd = process.env.NODE_ENV === "production";
  if (envSite) {
    const isLocal =
      envSite.includes("localhost") || envSite.includes("127.0.0.1");
    if ((isProd && !isLocal) || (!isProd && isLocal)) return envSite;
  }

  const vercelProd = normalizeBaseUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
  );
  if (vercelProd) return vercelProd;

  const vercelUrl = normalizeBaseUrl(process.env.VERCEL_URL ?? "");
  if (vercelUrl) return vercelUrl;

  return await pickBaseUrlFromHeaders();
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { sent, email, error, error_message, next } = await searchParams;

  async function sendMagicLink(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const next = String(formData.get("next") ?? "").trim();

    if (!email) {
      redirect(
        `/login?${new URLSearchParams({
          error: "1",
          error_message: "Email is required.",
          email: "",
          ...(next ? { next } : {}),
        }).toString()}`,
      );
    }

    const origin = await getBaseUrl();

    if (!origin) {
      const params = new URLSearchParams();
      params.set("error", "1");
      params.set(
        "error_message",
        "Missing request origin. Set NEXT_PUBLIC_SITE_URL in production.",
      );
      params.set("email", email);
      if (next) params.set("next", next);
      redirect(`/login?${params.toString()}`);
    }
    const supabase = await createClient();

    const callbackUrl = new URL("/auth/callback", origin);
    if (next) callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    // We always redirect back to /login so we don't leak auth state in a RSC render.
    const params = new URLSearchParams();
    if (error) {
      params.set("error", "1");
      params.set("error_message", error.message);
    } else params.set("sent", "1");
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
        <CardContent className="space-y-6">
          <MagicLinkForm
            action={sendMagicLink}
            defaultEmail={email ?? ""}
            next={next ?? ""}
            sent={sent === "1"}
            error={
              error === "1"
                ? (error_message ?? "Couldn’t send the magic link.")
                : null
            }
          />

          <div className="text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
