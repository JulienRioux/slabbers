import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EditCardForm } from "@/app/card/[id]/edit/EditCardForm";

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/card/${id}/edit`);
  }

  const { data: card, error } = await supabase
    .from("cards")
    .select(
      "id,user_id,is_private,title,year,player,brand,set_name,card_number,is_graded,grading_company,grade,rookie,autograph,serial_numbered,print_run,for_sale,price_cents,currency"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !card) {
    notFound();
  }

  if (card.user_id !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <EditCardForm
        cardId={card.id}
        initialValues={{
          title: card.title,
          year: card.year,
          player: card.player,
          brand: card.brand,
          is_private: Boolean(card.is_private),
          for_sale: Boolean(card.for_sale),
          price_cents: card.price_cents,
          currency: card.currency ?? "CAD",
          set_name: card.set_name,
          card_number: card.card_number,
          is_graded: Boolean(card.is_graded),
          grading_company: card.grading_company,
          grade: card.grade,
          rookie: Boolean(card.rookie),
          autograph: Boolean(card.autograph),
          serial_numbered: Boolean(card.serial_numbered),
          print_run: card.print_run,
        }}
      />
    </div>
  );
}
