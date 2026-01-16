import { redirect } from "next/navigation";

import { AddCardForm } from "@/app/add/AddCardForm";
import { createClient } from "@/lib/supabase/server";

export default async function AddCardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/add");
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <AddCardForm userEmail={user.email} />
    </div>
  );
}
