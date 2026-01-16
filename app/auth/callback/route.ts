import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    // Back-compat fallback (can be removed later)
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.redirect(new URL(next, requestUrl.origin));

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=1`, requestUrl.origin));
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    response = NextResponse.redirect(
      new URL(`/login?error=1`, requestUrl.origin)
    );
  }

  return response;
}
