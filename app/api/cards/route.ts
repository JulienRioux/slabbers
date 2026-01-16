import { NextResponse } from "next/server";

import { uploadCardImages } from "@/lib/cards/upload";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on";
}

function parseOptionalInt(value: FormDataEntryValue | null) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  const title = String(formData.get("title") ?? "").trim();
  const year = parseOptionalInt(formData.get("year"));
  const player = String(formData.get("player") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();

  const isPrivate = parseBoolean(formData.get("is_private"));

  const forSale = parseBoolean(formData.get("for_sale"));
  const priceCents = parseOptionalInt(formData.get("price_cents"));
  const currency = String(formData.get("currency") ?? "CAD").trim() || "CAD";

  const setName = String(formData.get("set_name") ?? "").trim() || null;
  const cardNumber = String(formData.get("card_number") ?? "").trim() || null;

  const isGraded = parseBoolean(formData.get("is_graded"));
  const gradingCompany =
    String(formData.get("grading_company") ?? "").trim() || null;
  const grade = String(formData.get("grade") ?? "").trim() || null;

  const rookie = parseBoolean(formData.get("rookie"));
  const autograph = parseBoolean(formData.get("autograph"));
  const serialNumbered = parseBoolean(formData.get("serial_numbered"));
  const printRun = parseOptionalInt(formData.get("print_run"));

  const images = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File);

  if (!title || !player || !brand || !year) {
    return NextResponse.json(
      { error: "Missing required fields: title, year, player, brand." },
      { status: 400 }
    );
  }

  if (images.length === 0) {
    return NextResponse.json(
      { error: "At least one image is required." },
      { status: 400 }
    );
  }

  if (forSale) {
    if (!priceCents || priceCents <= 0) {
      return NextResponse.json(
        { error: "price_cents is required when for_sale is true." },
        { status: 400 }
      );
    }
  }

  // Upload images to Storage
  let imageUrls: string[];
  try {
    const supabaseAdmin = createAdminClient();
    imageUrls = await uploadCardImages({
      supabase: supabaseAdmin,
      userId: user.id,
      files: images,
    });
  } catch (e: unknown) {
    const err = e as Record<string, unknown> | null;
    const message =
      err && typeof err.message === "string" ? err.message : "Image upload failed.";
    return NextResponse.json(
      {
        stage: "upload",
        error: message,
        code: (err?.code ?? err?.statusCode ?? null) as unknown,
        details: (err?.details ?? null) as unknown,
        hint: (err?.hint ?? null) as unknown,
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("cards")
    .insert({
      user_id: user.id,
      is_private: isPrivate,
      title,
      year,
      player,
      brand,
      set_name: setName,
      card_number: cardNumber,
      is_graded: isGraded,
      grading_company: gradingCompany,
      grade,
      rookie,
      autograph,
      serial_numbered: serialNumbered,
      print_run: printRun,
      for_sale: forSale,
      price_cents: forSale ? priceCents : null,
      currency,
      image_urls: imageUrls,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        stage: "insert",
        error: error.message,
        code:
          ("code" in error ? (error as { code?: unknown }).code : null) ?? null,
        details:
          ("details" in error ? (error as { details?: unknown }).details : null) ??
          null,
        hint:
          ("hint" in error ? (error as { hint?: unknown }).hint : null) ?? null,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ id: data.id });
}
