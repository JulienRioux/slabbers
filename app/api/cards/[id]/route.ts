import { NextResponse } from "next/server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

function toOptionalTrimmedString(value: unknown) {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function toRequiredTrimmedString(value: unknown) {
  const s = String(value ?? "").trim();
  return s;
}

function toOptionalInt(value: unknown) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value))
    return Math.trunc(value);
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value ?? "")
    .toLowerCase()
    .trim();
  return s === "true" || s === "1" || s === "on" || s === "yes";
}

function storagePathFromPublicUrl(url: string) {
  // Public URL pattern:
  //   .../storage/v1/object/public/card-images/<path>
  // Signed URL pattern:
  //   .../storage/v1/object/sign/card-images/<path>?token=...
  const bucket = "card-images";

  const publicNeedle = `/storage/v1/object/public/${bucket}/`;
  const signedNeedle = `/storage/v1/object/sign/${bucket}/`;

  const publicIdx = url.indexOf(publicNeedle);
  if (publicIdx >= 0) {
    return url.slice(publicIdx + publicNeedle.length).split("?")[0] ?? null;
  }

  const signedIdx = url.indexOf(signedNeedle);
  if (signedIdx >= 0) {
    return url.slice(signedIdx + signedNeedle.length).split("?")[0] ?? null;
  }

  return null;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch card (RLS applies)
  const { data: card, error: selectError } = await supabase
    .from("cards")
    .select("id,user_id,image_urls")
    .eq("id", id)
    .maybeSingle();

  if (selectError || !card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (card.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Best-effort remove images from storage
  try {
    const urls: string[] = Array.isArray(card.image_urls)
      ? card.image_urls
      : [];
    const paths = urls
      .map((u) => storagePathFromPublicUrl(String(u)))
      .filter((p): p is string => Boolean(p));

    if (paths.length > 0) {
      const admin = createAdminClient();
      await admin.storage.from("card-images").remove(paths);
    }
  } catch {
    // Ignore storage cleanup errors; still delete the card row.
  }

  const { error: deleteError } = await supabase
    .from("cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown> | null;

  const title = toRequiredTrimmedString(payload?.title);
  const year = toOptionalInt(payload?.year);
  const player = toRequiredTrimmedString(payload?.player);
  const manufacturer = toRequiredTrimmedString(payload?.manufacturer);

  const team = toOptionalTrimmedString(payload?.team);
  const league = toOptionalTrimmedString(payload?.league);
  const isSport = toBoolean(payload?.is_sport);
  const sport = toOptionalTrimmedString(payload?.sport);

  const condition = toOptionalTrimmedString(payload?.condition);
  const conditionDetail = toOptionalTrimmedString(payload?.condition_detail);
  const countryOfOrigin = toOptionalTrimmedString(payload?.country_of_origin);
  const originalLicensedReprint = toOptionalTrimmedString(
    payload?.original_licensed_reprint
  );
  const parallelVariety = toOptionalTrimmedString(payload?.parallel_variety);
  const features = toOptionalTrimmedString(payload?.features);
  const season = toOptionalTrimmedString(payload?.season);
  const yearManufactured = toOptionalInt(payload?.year_manufactured);

  const isPrivate = toBoolean(payload?.is_private);

  const forSale = toBoolean(payload?.for_sale);
  const priceCents = toOptionalInt(payload?.price_cents);
  const currency = toRequiredTrimmedString(payload?.currency) || "CAD";


  const setName = toOptionalTrimmedString(payload?.set_name);
  const cardNumber = toOptionalTrimmedString(payload?.card_number);

  const isGraded = toBoolean(payload?.is_graded);
  const gradingCompany = toOptionalTrimmedString(payload?.grading_company);
  const grade = toOptionalTrimmedString(payload?.grade);

  const rookie = toBoolean(payload?.rookie);
  const autograph = toBoolean(payload?.autograph);
  const serialNumbered = toBoolean(payload?.serial_numbered);
  const printRun = toOptionalInt(payload?.print_run);

  const notes = toOptionalTrimmedString(payload?.notes);

  if (!title || !player || !manufacturer || !year) {
    return NextResponse.json(
      { error: "Missing required fields: title, year, player, manufacturer." },
      { status: 400 }
    );
  }

  if (isSport && !sport) {
    return NextResponse.json(
      { error: "sport is required when is_sport is true." },
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

  const { data, error } = await supabase
    .from("cards")
    .update({
      title,
      year,
      player,
      manufacturer,
      team: isSport ? team : null,
      league: isSport ? league : null,
      is_sport: isSport,
      sport: isSport ? sport : null,
      condition,
      condition_detail: conditionDetail,
      country_of_origin: countryOfOrigin,
      original_licensed_reprint: originalLicensedReprint,
      parallel_variety: parallelVariety,
      features,
      season,
      year_manufactured: yearManufactured,
      is_private: isPrivate,
      set_name: setName,
      card_number: cardNumber,
      is_graded: isGraded,
      grading_company: isGraded ? gradingCompany : null,
      grade: isGraded ? grade : null,
      rookie,
      autograph,
      serial_numbered: serialNumbered,
      print_run: serialNumbered ? printRun : null,
      for_sale: forSale,
      price_cents: forSale ? priceCents : null,
      currency,
      notes,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
