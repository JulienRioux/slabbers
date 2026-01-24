"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  userEmail?: string | null;
};

const GRADING_COMPANIES = [
  "PSA",
  "BGS",
  "SGC",
  "CGC",
  "TAG",
  "Mint",
  "Others",
] as const;

const NON_NUMERIC_GRADE_OPTIONS = ["OTHER"] as const;

const GRADE_OPTIONS = Array.from({ length: 19 }, (_, idx) => {
  const value = 1 + idx * 0.5;
  return Number.isInteger(value) ? String(value) : String(value);
});

const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD", "JPY"] as const;

const SPORTS = [
  "Baseball",
  "Basketball",
  "Football",
  "Hockey",
  "Soccer",
  "Golf",
  "Tennis",
  "MMA",
  "Boxing",
  "Racing",
  "Other",
] as const;

const ORIGINAL_LICENSED_REPRINT_OPTIONS = [
  "Original",
  "Licensed Reprint",
  "Reprint",
  "Unknown",
] as const;

export function AddCardForm({ userEmail: _userEmail }: Props) {
  const router = useRouter();
  void _userEmail;

  type SelectedImage = {
    id: string;
    file: File;
    url: string;
  };

  type IdentifyResult = {
    confidence: number;
    title: string | null;
    year: number | null;
    player: string | null;
    manufacturer: string | null;
    team: string | null;
    league: string | null;
    sport: string | null;
    set_name: string | null;
    card_number: string | null;
    condition: string | null;
    condition_detail: string | null;
    country_of_origin: string | null;
    original_licensed_reprint: string | null;
    parallel_variety: string | null;
    features: string | null;
    season: string | null;
    year_manufactured: number | null;
    description: string | null;
    estimated_price: number | null;
    estimated_currency: string | null;
    autograph: boolean | null;
    is_graded: boolean | null;
    grading_company: string | null;
    grade: string | null;
    evidence_text: string | null;

    ebay_listings_used: number;

    ebay_listings: Array<{
      title: string;
      price: number;
      currency: string;
      web_url: string;
      image_url?: string;
    }>;
  };

  function parseEbayListings(input: unknown): IdentifyResult["ebay_listings"] {
    if (!Array.isArray(input)) return [];
    return input
      .map((x) => {
        const obj = x as Record<string, unknown>;
        const title = typeof obj.title === "string" ? obj.title : "";
        const price =
          typeof obj.price === "number"
            ? obj.price
            : typeof obj.price === "string"
              ? Number(obj.price)
              : NaN;
        const currency = typeof obj.currency === "string" ? obj.currency : "";
        const web_url = typeof obj.web_url === "string" ? obj.web_url : "";
        const image_url =
          typeof obj.image_url === "string" ? obj.image_url : undefined;
        return { title, price, currency, web_url, image_url };
      })
      .filter(
        (x) => x.title && x.web_url && Number.isFinite(x.price) && x.price > 0,
      )
      .slice(0, 6);
  }

  const [title, setTitle] = React.useState("");
  const [year, setYear] = React.useState("");
  const [player, setPlayer] = React.useState("");
  const [manufacturer, setManufacturer] = React.useState("");

  const [isSport, setIsSport] = React.useState(true);
  const [sportChoice, setSportChoice] = React.useState<string>("");
  const [sportCustom, setSportCustom] = React.useState("");
  const [team, setTeam] = React.useState("");
  const [league, setLeague] = React.useState("");

  const [condition, setCondition] = React.useState("");
  const [conditionDetail, setConditionDetail] = React.useState("");
  const [countryOfOrigin, setCountryOfOrigin] = React.useState("");
  const [originalLicensedReprint, setOriginalLicensedReprint] = React.useState<
    (typeof ORIGINAL_LICENSED_REPRINT_OPTIONS)[number] | ""
  >("");
  const [parallelVariety, setParallelVariety] = React.useState("");
  const [features, setFeatures] = React.useState("");
  const [season, setSeason] = React.useState("");
  const [yearManufactured, setYearManufactured] = React.useState("");

  const [isPrivate, setIsPrivate] = React.useState(false);

  const [forSale, setForSale] = React.useState(true);
  const [priceCad, setPriceCad] = React.useState("");
  const [priceCurrency, setPriceCurrency] = React.useState<
    (typeof CURRENCIES)[number]
  >(CURRENCIES[0]);

  const [setName, setSetName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");

  const [isGraded, setIsGraded] = React.useState(false);
  const [gradingCompany, setGradingCompany] = React.useState("");
  const [grade, setGrade] = React.useState("");

  const [rookie, setRookie] = React.useState(false);
  const [autograph, setAutograph] = React.useState(false);
  const [serialNumbered, setSerialNumbered] = React.useState(false);
  const [printRun, setPrintRun] = React.useState("");

  const [description, setDescription] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [step, setStep] = React.useState<1 | 2>(1);

  const frontInputRef = React.useRef<HTMLInputElement | null>(null);
  const backInputRef = React.useRef<HTMLInputElement | null>(null);
  const optionalInputRef = React.useRef<HTMLInputElement | null>(null);

  const [frontImage, setFrontImage] = React.useState<SelectedImage | null>(
    null,
  );
  const [backImage, setBackImage] = React.useState<SelectedImage | null>(null);
  const [optionalImages, setOptionalImages] = React.useState<SelectedImage[]>(
    [],
  );

  const [identifyResult, setIdentifyResult] =
    React.useState<IdentifyResult | null>(null);
  const [identifyError, setIdentifyError] = React.useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = React.useState(false);

  const [isCroppingFront, setIsCroppingFront] = React.useState(false);
  const [isCroppingBack, setIsCroppingBack] = React.useState(false);
  const [cropError, setCropError] = React.useState<string | null>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const objectUrlsRef = React.useRef<Set<string>>(new Set());
  const frontCropTokenRef = React.useRef(0);
  const backCropTokenRef = React.useRef(0);

  React.useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function makeId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function makeSelectedImage(file: File): SelectedImage {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return { id: makeId(), file, url };
  }

  function revokeSelectedImage(img: SelectedImage | null) {
    if (!img) return;
    URL.revokeObjectURL(img.url);
    objectUrlsRef.current.delete(img.url);
  }

  function buildCroppedFileName(file: File) {
    const name = file.name || "card";
    const base = name.replace(/\.[^.]+$/, "");
    const suffix = base.endsWith("-cropped") ? base : `${base}-cropped`;
    return `${suffix}.jpg`;
  }

  async function requestCrop(file: File): Promise<File> {
    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch("/api/card/crop", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(json?.error ?? "Failed to crop image.");
    }

    const blob = await res.blob();
    return new File([blob], buildCroppedFileName(file), {
      type: blob.type || "image/jpeg",
    });
  }

  async function onPickFront(fileList: FileList | null) {
    const file = Array.from(fileList ?? []).find(
      (f) => f instanceof File && (f.type?.startsWith("image/") ?? false),
    );
    if (!file) return;

    const token = ++frontCropTokenRef.current;
    setCropError(null);

    const initial = makeSelectedImage(file);
    setFrontImage((prev) => {
      revokeSelectedImage(prev);
      return initial;
    });

    setIdentifyResult(null);
    setIdentifyError(null);

    setIsCroppingFront(true);
    try {
      const cropped = await requestCrop(file);
      if (frontCropTokenRef.current !== token) return;
      setFrontImage((prev) => {
        revokeSelectedImage(prev);
        return makeSelectedImage(cropped);
      });
    } catch (e: unknown) {
      if (frontCropTokenRef.current !== token) return;
      const message =
        e instanceof Error ? e.message : "Failed to crop front image.";
      setCropError(message);
    } finally {
      if (frontCropTokenRef.current === token) setIsCroppingFront(false);
    }
  }

  async function onPickBack(fileList: FileList | null) {
    const file = Array.from(fileList ?? []).find(
      (f) => f instanceof File && (f.type?.startsWith("image/") ?? false),
    );
    if (!file) return;

    const token = ++backCropTokenRef.current;
    setCropError(null);

    const initial = makeSelectedImage(file);
    setBackImage((prev) => {
      revokeSelectedImage(prev);
      return initial;
    });

    setIdentifyResult(null);
    setIdentifyError(null);

    setIsCroppingBack(true);
    try {
      const cropped = await requestCrop(file);
      if (backCropTokenRef.current !== token) return;
      setBackImage((prev) => {
        revokeSelectedImage(prev);
        return makeSelectedImage(cropped);
      });
    } catch (e: unknown) {
      if (backCropTokenRef.current !== token) return;
      const message =
        e instanceof Error ? e.message : "Failed to crop back image.";
      setCropError(message);
    } finally {
      if (backCropTokenRef.current === token) setIsCroppingBack(false);
    }
  }

  function addOptionalFiles(fileList: FileList | null) {
    const nextFiles = Array.from(fileList ?? []).filter(
      (f) => f instanceof File && (f.type?.startsWith("image/") ?? false),
    );
    if (nextFiles.length === 0) return;

    setOptionalImages((prev) => [
      ...prev,
      ...nextFiles.map((file) => makeSelectedImage(file)),
    ]);
  }

  function removeOptionalImage(id: string) {
    setOptionalImages((prev) => {
      const item = prev.find((x) => x.id === id);
      revokeSelectedImage(item ?? null);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function runIdentification(): Promise<boolean> {
    if (!frontImage || !backImage) {
      setIdentifyResult(null);
      setIdentifyError(null);
      return false;
    }

    return identifyFromImages([frontImage.file, backImage.file]);
  }

  async function identifyFromImages(filesToIdentify: File[]): Promise<boolean> {
    setIdentifyError(null);
    setIdentifyResult(null);

    if (filesToIdentify.length === 0) return false;

    setIsIdentifying(true);
    try {
      const fd = new FormData();
      for (const f of filesToIdentify) fd.append("images", f);

      const res = await fetch("/api/cards/identify", {
        method: "POST",
        body: fd,
      });

      const json = (await res
        .json()
        .catch(() => ({}))) as Partial<IdentifyResult> & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to identify card.");
      }

      setIdentifyResult({
        confidence: Number(json.confidence ?? 0),
        title: typeof json.title === "string" ? json.title : null,
        year: typeof json.year === "number" ? json.year : null,
        player: typeof json.player === "string" ? json.player : null,
        manufacturer:
          typeof json.manufacturer === "string" ? json.manufacturer : null,
        team: typeof json.team === "string" ? json.team : null,
        league: typeof json.league === "string" ? json.league : null,
        sport: typeof json.sport === "string" ? json.sport : null,
        set_name: typeof json.set_name === "string" ? json.set_name : null,
        card_number:
          typeof json.card_number === "string" ? json.card_number : null,
        condition: typeof json.condition === "string" ? json.condition : null,
        condition_detail:
          typeof json.condition_detail === "string"
            ? json.condition_detail
            : null,
        country_of_origin:
          typeof json.country_of_origin === "string"
            ? json.country_of_origin
            : null,
        original_licensed_reprint:
          typeof json.original_licensed_reprint === "string"
            ? json.original_licensed_reprint
            : null,
        parallel_variety:
          typeof json.parallel_variety === "string"
            ? json.parallel_variety
            : null,
        features: typeof json.features === "string" ? json.features : null,
        season: typeof json.season === "string" ? json.season : null,
        year_manufactured:
          typeof json.year_manufactured === "number"
            ? json.year_manufactured
            : null,
        description:
          typeof json.description === "string" ? json.description : null,
        estimated_price:
          typeof json.estimated_price === "number"
            ? json.estimated_price
            : null,
        estimated_currency:
          typeof json.estimated_currency === "string"
            ? json.estimated_currency
            : null,
        autograph: typeof json.autograph === "boolean" ? json.autograph : null,
        is_graded: typeof json.is_graded === "boolean" ? json.is_graded : null,
        grading_company:
          typeof json.grading_company === "string"
            ? json.grading_company
            : null,
        grade: typeof json.grade === "string" ? json.grade : null,
        evidence_text:
          typeof json.evidence_text === "string" ? json.evidence_text : null,

        ebay_listings_used:
          typeof json.ebay_listings_used === "number"
            ? json.ebay_listings_used
            : 0,

        ebay_listings: parseEbayListings(json.ebay_listings),
      });

      if (typeof json.title === "string" && json.title.trim())
        setTitle(json.title);
      if (typeof json.player === "string" && json.player.trim())
        setPlayer(json.player);
      if (typeof json.manufacturer === "string" && json.manufacturer.trim())
        setManufacturer(json.manufacturer);
      if (typeof json.team === "string" && json.team.trim()) setTeam(json.team);
      if (typeof json.league === "string" && json.league.trim())
        setLeague(json.league);
      if (typeof json.sport === "string" && json.sport.trim()) {
        const nextSport = json.sport.trim();
        if ((SPORTS as readonly string[]).includes(nextSport)) {
          setSportChoice(nextSport);
          setSportCustom("");
        } else {
          setSportChoice("Other");
          setSportCustom(nextSport);
        }
      }
      if (typeof json.year === "number" && Number.isFinite(json.year))
        setYear(String(json.year));
      if (typeof json.set_name === "string" && json.set_name.trim())
        setSetName(json.set_name);
      if (typeof json.card_number === "string" && json.card_number.trim())
        setCardNumber(json.card_number);
      if (typeof json.condition === "string" && json.condition.trim())
        setCondition(json.condition);
      if (
        typeof json.condition_detail === "string" &&
        json.condition_detail.trim()
      )
        setConditionDetail(json.condition_detail);
      if (
        typeof json.country_of_origin === "string" &&
        json.country_of_origin.trim()
      )
        setCountryOfOrigin(json.country_of_origin);
      if (
        typeof json.original_licensed_reprint === "string" &&
        json.original_licensed_reprint.trim()
      ) {
        const nextValue = json.original_licensed_reprint.trim();
        if (
          (ORIGINAL_LICENSED_REPRINT_OPTIONS as readonly string[]).includes(
            nextValue,
          )
        ) {
          setOriginalLicensedReprint(
            nextValue as (typeof ORIGINAL_LICENSED_REPRINT_OPTIONS)[number],
          );
        }
      }
      if (
        typeof json.parallel_variety === "string" &&
        json.parallel_variety.trim()
      )
        setParallelVariety(json.parallel_variety);
      if (typeof json.features === "string" && json.features.trim())
        setFeatures(json.features);
      if (typeof json.season === "string" && json.season.trim())
        setSeason(json.season);
      if (
        typeof json.year_manufactured === "number" &&
        Number.isFinite(json.year_manufactured)
      )
        setYearManufactured(String(json.year_manufactured));

      if (typeof json.autograph === "boolean") setAutograph(json.autograph);
      if (typeof json.is_graded === "boolean") setIsGraded(json.is_graded);
      if (
        typeof json.grading_company === "string" &&
        json.grading_company.trim()
      )
        setGradingCompany(json.grading_company);
      if (typeof json.grade === "string" && json.grade.trim())
        setGrade(json.grade);

      if (
        typeof json.estimated_price === "number" &&
        Number.isFinite(json.estimated_price)
      ) {
        setPriceCad(String(json.estimated_price.toFixed(2)));
        setForSale(true);
      }

      if (typeof json.description === "string" && json.description.trim()) {
        const nextDescription = json.description.trim();
        setDescription((prev) => (prev.trim() ? prev : nextDescription));
      }

      return true;
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to identify card.";
      setIdentifyError(message);
      return false;
    } finally {
      setIsIdentifying(false);
    }
  }

  async function continueFromImagesStep() {
    setError(null);

    if (!frontImage) {
      setError("Please upload a front image.");
      setStep(1);
      return;
    }

    if (!backImage) {
      setError("Please upload a back image.");
      return;
    }

    const ok = await runIdentification();
    if (ok) setStep(2);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);

    if (step !== 2) {
      setError("Please complete identification first.");
      setStep(1);
      return;
    }

    if (!frontImage || !backImage) {
      setError("Please upload a front and back image.");
      setStep(1);
      return;
    }

    const cleanedTitle = title.trim();
    const cleanedPlayer = player.trim();
    const cleanedManufacturer = manufacturer.trim();
    const parsedYear = Number(year);

    if (
      !cleanedTitle ||
      !cleanedPlayer ||
      !cleanedManufacturer ||
      !Number.isFinite(parsedYear)
    ) {
      setError("Please fill in title, year, player, and manufacturer.");
      return;
    }

    let priceCents: number | null = null;
    if (forSale) {
      const parsedPrice = Number(priceCad);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setError("Price is required when for sale.");
        return;
      }
      priceCents = Math.round(parsedPrice * 100);
    }

    const effectiveSport =
      sportChoice === "Other" ? sportCustom.trim() : sportChoice.trim();
    if (isSport && !effectiveSport) {
      setError("Sport is required when this is a sports card.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("title", cleanedTitle);
      formData.set("year", String(parsedYear));
      formData.set("player", cleanedPlayer);
      formData.set("manufacturer", cleanedManufacturer);
      formData.set("team", team.trim());
      formData.set("league", league.trim());
      formData.set("is_sport", String(isSport));
      if (isSport && effectiveSport) formData.set("sport", effectiveSport);
      if (condition.trim()) formData.set("condition", condition.trim());
      if (conditionDetail.trim())
        formData.set("condition_detail", conditionDetail.trim());
      if (countryOfOrigin.trim())
        formData.set("country_of_origin", countryOfOrigin.trim());
      if (originalLicensedReprint)
        formData.set("original_licensed_reprint", originalLicensedReprint);
      if (parallelVariety.trim())
        formData.set("parallel_variety", parallelVariety.trim());
      if (features.trim()) formData.set("features", features.trim());
      if (season.trim()) formData.set("season", season.trim());
      if (yearManufactured.trim())
        formData.set("year_manufactured", yearManufactured.trim());
      formData.set("is_private", String(isPrivate));

      formData.set("for_sale", String(forSale));
      if (forSale && priceCents) {
        formData.set("price_cents", String(priceCents));
      }
      formData.set("currency", priceCurrency);

      if (setName.trim()) formData.set("set_name", setName.trim());
      if (cardNumber.trim()) formData.set("card_number", cardNumber.trim());

      formData.set("is_graded", String(isGraded));
      if (gradingCompany.trim())
        formData.set("grading_company", gradingCompany.trim());
      if (grade.trim()) formData.set("grade", grade.trim());

      formData.set("rookie", String(rookie));
      formData.set("autograph", String(autograph));
      formData.set("serial_numbered", String(serialNumbered));
      if (serialNumbered && printRun) formData.set("print_run", printRun);

      if (description.trim()) formData.set("description", description.trim());
      if (notes.trim()) formData.set("notes", notes.trim());

      formData.append("front_image", frontImage.file);
      formData.append("back_image", backImage.file);
      for (const img of optionalImages) formData.append("images", img.file);

      const res = await fetch("/api/cards", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error ?? "Failed to save card.";
        const stage = json?.stage ? ` (${json.stage})` : "";
        const more =
          json?.details || json?.hint
            ? `\n${json?.details ?? ""}${json?.hint ? `\n${json.hint}` : ""}`
            : "";
        throw new Error(`${msg}${stage}${more}`);
      }

      router.push(`/card/${json.id}`);
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a card</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-6">
          {step === 1 || step === 2 ? (
            <p className="text-sm text-muted-foreground">Step {step} of 2</p>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label>Front image</Label>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Upload the front of the card.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => frontInputRef.current?.click()}
                  >
                    Add front
                  </Button>
                </div>
                <input
                  ref={frontInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    void onPickFront(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />

                {frontImage ? (
                  <div className="rounded-md border border-border p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frontImage.url}
                      alt="Front"
                      className="mx-auto h-72 w-full max-w-md rounded-md object-contain"
                    />
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {frontImage.file.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Please add a front image.
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label>Back image</Label>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Upload the back of the card.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => backInputRef.current?.click()}
                  >
                    Add back
                  </Button>
                </div>
                <input
                  ref={backInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    void onPickBack(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />

                {backImage ? (
                  <div className="rounded-md border border-border p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={backImage.url}
                      alt="Back"
                      className="mx-auto h-72 w-full max-w-md rounded-md object-contain"
                    />
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {backImage.file.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Please add a back image.
                  </p>
                )}
              </div>

              {isIdentifying ? (
                <p className="text-sm text-muted-foreground">Identifying…</p>
              ) : null}
              {isCroppingFront || isCroppingBack ? (
                <p className="text-sm text-muted-foreground">
                  Cropping images…
                </p>
              ) : null}
              {identifyError ? (
                <p className="text-sm text-destructive">{identifyError}</p>
              ) : null}
              {cropError ? (
                <p className="text-sm text-destructive">{cropError}</p>
              ) : null}

              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={
                    !frontImage ||
                    !backImage ||
                    isIdentifying ||
                    isCroppingFront ||
                    isCroppingBack
                  }
                  onClick={() => void continueFromImagesStep()}
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <>
              {identifyResult ? (
                <p className="text-sm text-muted-foreground">
                  Detected
                  {identifyResult.player ||
                  identifyResult.year ||
                  identifyResult.manufacturer
                    ? ":"
                    : ""}{" "}
                  {[
                    identifyResult.year,
                    identifyResult.player,
                    identifyResult.manufacturer,
                  ]
                    .filter(Boolean)
                    .join(" ")}{" "}
                  (
                  {Math.max(
                    0,
                    Math.min(100, Math.round(identifyResult.confidence)),
                  )}
                  % confidence)
                </p>
              ) : null}

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>Optional images</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => optionalInputRef.current?.click()}
                  >
                    Add images
                  </Button>
                </div>

                <input
                  ref={optionalInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    addOptionalFiles(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />

                {optionalImages.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {optionalImages.map((img) => (
                      <div
                        key={img.id}
                        className="flex items-center gap-3 rounded-md border border-border p-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt="Optional"
                          className="h-20 w-20 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{img.file.name}</p>
                          <div className="mt-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeOptionalImage(img.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add one or more images (camera supported on mobile).
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  inputMode="numeric"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2003"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="player">Player</Label>
                <Input
                  id="player"
                  value={player}
                  onChange={(e) => setPlayer(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label>Visibility</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isPrivate"
                    checked={isPrivate}
                    onCheckedChange={(v) => setIsPrivate(Boolean(v))}
                  />
                  <Label htmlFor="isPrivate" className="font-normal">
                    Private (only you can view)
                  </Label>
                </div>
              </div>

              <div className="grid gap-3">
                <Label>For sale</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="forSale"
                    checked={forSale}
                    onCheckedChange={(v) => setForSale(Boolean(v))}
                  />
                  <Label htmlFor="forSale" className="font-normal">
                    Mark this card as for sale
                  </Label>
                </div>
                {forSale ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        inputMode="decimal"
                        value={priceCad}
                        onChange={(e) => setPriceCad(e.target.value)}
                        placeholder="e.g. 250"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="priceCurrency">Currency</Label>
                      <Select
                        value={priceCurrency}
                        onValueChange={(next) =>
                          setPriceCurrency(next as (typeof CURRENCIES)[number])
                        }
                      >
                        <SelectTrigger id="priceCurrency">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 rounded-md border border-border p-4">
                <p className="text-sm font-medium">Optional</p>

                <div className="grid gap-3">
                  <Label>Sport details</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isSport"
                      checked={isSport}
                      onCheckedChange={(v) => setIsSport(Boolean(v))}
                    />
                    <Label htmlFor="isSport" className="font-normal">
                      This is a sports card
                    </Label>
                  </div>

                  {isSport ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <Label htmlFor="sport">Sport</Label>
                        <Select
                          value={sportChoice || undefined}
                          onValueChange={(next) => setSportChoice(next)}
                        >
                          <SelectTrigger id="sport">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPORTS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {sportChoice === "Other" ? (
                        <div className="grid gap-2">
                          <Label htmlFor="sportCustom">Custom sport</Label>
                          <Input
                            id="sportCustom"
                            value={sportCustom}
                            onChange={(e) => setSportCustom(e.target.value)}
                            placeholder="e.g. Lacrosse"
                          />
                        </div>
                      ) : null}
                      <div className="grid gap-2">
                        <Label htmlFor="league">League</Label>
                        <Input
                          id="league"
                          value={league}
                          onChange={(e) => setLeague(e.target.value)}
                          placeholder="e.g. NHL"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="team">Team</Label>
                        <Input
                          id="team"
                          value={team}
                          onChange={(e) => setTeam(e.target.value)}
                          placeholder="e.g. Canadiens"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="countryOfOrigin">Country of origin</Label>
                    <Input
                      id="countryOfOrigin"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      placeholder="e.g. United States"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Input
                      id="condition"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      placeholder="e.g. Near Mint or Better"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="conditionDetail">Condition details</Label>
                    <Input
                      id="conditionDetail"
                      value={conditionDetail}
                      onChange={(e) => setConditionDetail(e.target.value)}
                      placeholder="e.g. Not in original packaging"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="originalLicensedReprint">
                      Original/Licensed Reprint
                    </Label>
                    <Select
                      value={originalLicensedReprint || undefined}
                      onValueChange={(next) =>
                        setOriginalLicensedReprint(
                          next as (typeof ORIGINAL_LICENSED_REPRINT_OPTIONS)[number],
                        )
                      }
                    >
                      <SelectTrigger id="originalLicensedReprint">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORIGINAL_LICENSED_REPRINT_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="parallelVariety">Parallel/Variety</Label>
                    <Input
                      id="parallelVariety"
                      value={parallelVariety}
                      onChange={(e) => setParallelVariety(e.target.value)}
                      placeholder="e.g. Red"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="season">Season</Label>
                    <Input
                      id="season"
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      placeholder="e.g. 1998-99"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="yearManufactured">Year manufactured</Label>
                    <Input
                      id="yearManufactured"
                      inputMode="numeric"
                      value={yearManufactured}
                      onChange={(e) => setYearManufactured(e.target.value)}
                      placeholder="e.g. 1998"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="features">Features</Label>
                  <Input
                    id="features"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="e.g. Insert, Parallel, Short Print"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="setName">Set name</Label>
                  <Input
                    id="setName"
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cardNumber">Card number</Label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>

                <div className="grid gap-3">
                  <Label>Grading</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isGraded"
                      checked={isGraded}
                      onCheckedChange={(v) => setIsGraded(Boolean(v))}
                    />
                    <Label htmlFor="isGraded" className="font-normal">
                      This card is graded
                    </Label>
                  </div>

                  {isGraded ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="gradingCompany">Grading company</Label>
                        <Select
                          value={gradingCompany || undefined}
                          onValueChange={(next) => setGradingCompany(next)}
                        >
                          <SelectTrigger id="gradingCompany">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADING_COMPANIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="grade">Grade</Label>
                        <Select
                          value={grade || undefined}
                          onValueChange={(next) => setGrade(next)}
                        >
                          <SelectTrigger id="grade">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {NON_NUMERIC_GRADE_OPTIONS.map((g) => (
                              <SelectItem key={g} value={g}>
                                Other
                              </SelectItem>
                            ))}
                            {GRADE_OPTIONS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label>Flags</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rookie"
                      checked={rookie}
                      onCheckedChange={(v) => setRookie(Boolean(v))}
                    />
                    <Label htmlFor="rookie" className="font-normal">
                      Rookie
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="autograph"
                      checked={autograph}
                      onCheckedChange={(v) => setAutograph(Boolean(v))}
                    />
                    <Label htmlFor="autograph" className="font-normal">
                      Autograph
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="serialNumbered"
                      checked={serialNumbered}
                      onCheckedChange={(v) => setSerialNumbered(Boolean(v))}
                    />
                    <Label htmlFor="serialNumbered" className="font-normal">
                      Serial numbered
                    </Label>
                  </div>

                  {serialNumbered ? (
                    <div className="grid gap-2">
                      <Label htmlFor="printRun">Print run</Label>
                      <Input
                        id="printRun"
                        inputMode="numeric"
                        value={printRun}
                        onChange={(e) => setPrintRun(e.target.value)}
                        placeholder="e.g. 99"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Listing description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 2003 Topps Chrome LeBron James RC #111. Clean corners, slight surface wear. See photos for condition."
                    className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes or provenance details"
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Add card"}
              </Button>
            </>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
