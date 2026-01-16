import { notFound, redirect } from "next/navigation";
import Link from "next/link";

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
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { uploadProfileAvatar } from "@/lib/profiles/uploadAvatar";

export default async function EditProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/user/${id}/edit`);
  }

  if (user.id !== id) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,bio")
    .eq("id", id)
    .maybeSingle();

  async function saveProfile(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== id) {
      redirect("/login");
    }

    const username = String(formData.get("username") ?? "").trim() || null;
    const displayName =
      String(formData.get("display_name") ?? "").trim() || null;
    const bio = String(formData.get("bio") ?? "").trim() || null;

    const avatarFile = formData.get("avatar");
    let avatarUrl: string | null = null;
    if (avatarFile instanceof File && avatarFile.size > 0) {
      const admin = createAdminClient();
      avatarUrl = await uploadProfileAvatar({
        supabase: admin,
        userId: user.id,
        file: avatarFile,
      });
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        username,
        display_name: displayName,
        ...(avatarUrl != null ? { avatar_url: avatarUrl } : {}),
        bio,
      },
      { onConflict: "id" }
    );

    if (error) {
      const params = new URLSearchParams();
      params.set("error", error.message);
      redirect(`/user/${id}/edit?${params.toString()}`);
    }

    redirect(`/user/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>
            Update your public collector profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveProfile} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={profile?.display_name ?? ""}
                placeholder="e.g. Julien"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                defaultValue={profile?.username ?? ""}
                placeholder="e.g. slabcollector"
              />
              <p className="text-xs text-muted-foreground">
                Optional public handle (must be unique).
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                name="bio"
                defaultValue={profile?.bio ?? ""}
                placeholder="e.g. Hockey cards, mostly graded."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Input id="avatar" name="avatar" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground">
                Upload an image (saved in Storage). Leave empty to keep your
                current avatar.
              </p>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="Current avatar"
                  className="h-14 w-14 rounded-full border border-border object-cover"
                />
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit">Save</Button>
              <Button asChild type="button" variant="outline">
                <Link href={`/user/${id}`}>Cancel</Link>
              </Button>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
