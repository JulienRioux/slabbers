import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadCardImages({
  supabase,
  userId,
  files,
}: {
  supabase: SupabaseClient;
  userId: string;
  files: File[];
}) {
  const bucket = "card-images";

  const urls: string[] = [];

  for (const file of files) {
    const safeName = file.name.replaceAll("/", "-");
    const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded image");
    }

    urls.push(data.publicUrl);
  }

  return urls;
}
