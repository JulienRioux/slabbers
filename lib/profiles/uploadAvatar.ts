import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadProfileAvatar({
  supabase,
  userId,
  file,
}: {
  supabase: SupabaseClient;
  userId: string;
  file: File;
}) {
  const bucket = "profile-avatars";

  const safeName = file.name.replaceAll("/", "-");
  const ext = safeName.includes(".") ? safeName.split(".").pop() : null;
  const path = `${userId}/avatar${ext ? `.${ext}` : ""}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded avatar");
  }

  return data.publicUrl;
}
