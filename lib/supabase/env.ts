function requireEnv(value: string | undefined, names: string[]): string {
  if (value) return value;
  throw new Error(`Missing required env var (tried: ${names.join(", ")})`);
}

export function getSupabaseUrl(): string {
  return requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]
  );
}

export function getSupabasePublishableKey(): string {
  return requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
      process.env.SUPABASE_ANON_KEY,
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_PUBLISHABLE_DEFAULT_KEY",
      "SUPABASE_ANON_KEY",
    ]
  );
}

export function getSupabaseSecretKey(): string {
  return requireEnv(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
    ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
  );
}
