"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InitialValues = {
  title: string;
  year: number;
  player: string;
  manufacturer: string;
  team: string | null;
  league: string | null;
  is_sport: boolean;
  sport: string | null;
  condition: string | null;
  condition_detail: string | null;
  country_of_origin: string | null;
  original_licensed_reprint: string | null;
  parallel_variety: string | null;
  features: string | null;
  season: string | null;
  year_manufactured: number | null;
  is_private: boolean;
  for_sale: boolean;
  price_cents: number | null;
  currency: string;
  set_name: string | null;
  card_number: string | null;
  is_graded: boolean;
  grading_company: string | null;
  grade: string | null;
  rookie: boolean;
  autograph: boolean;
  serial_numbered: boolean;
  print_run: number | null;
  description: string | null;
  notes: string | null;
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

export function EditCardForm({
  cardId,
  initialValues,
}: {
  cardId: string;
  initialValues: InitialValues;
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState(initialValues.title ?? "");
  const [year, setYear] = React.useState(String(initialValues.year ?? ""));
  const [player, setPlayer] = React.useState(initialValues.player ?? "");
  const [manufacturer, setManufacturer] = React.useState(
    initialValues.manufacturer ?? "",
  );

  const [isSport, setIsSport] = React.useState(Boolean(initialValues.is_sport));
  const [sportChoice, setSportChoice] = React.useState<string>(() => {
    const initial = String(initialValues.sport ?? "").trim();
    if (!initial) return "";
    return (SPORTS as readonly string[]).includes(initial) ? initial : "Other";
  });
  const [sportCustom, setSportCustom] = React.useState(() => {
    const initial = String(initialValues.sport ?? "").trim();
    return (SPORTS as readonly string[]).includes(initial) ? "" : initial;
  });
  const [team, setTeam] = React.useState(initialValues.team ?? "");
  const [league, setLeague] = React.useState(initialValues.league ?? "");

  const [condition, setCondition] = React.useState(
    initialValues.condition ?? "",
  );
  const [conditionDetail, setConditionDetail] = React.useState(
    initialValues.condition_detail ?? "",
  );
  const [countryOfOrigin, setCountryOfOrigin] = React.useState(
    initialValues.country_of_origin ?? "",
  );
  const [originalLicensedReprint, setOriginalLicensedReprint] = React.useState<
    (typeof ORIGINAL_LICENSED_REPRINT_OPTIONS)[number] | ""
  >(
    (ORIGINAL_LICENSED_REPRINT_OPTIONS as readonly string[]).includes(
      String(initialValues.original_licensed_reprint ?? ""),
    )
      ? (initialValues.original_licensed_reprint as (typeof ORIGINAL_LICENSED_REPRINT_OPTIONS)[number])
      : "",
  );
  const [parallelVariety, setParallelVariety] = React.useState(
    initialValues.parallel_variety ?? "",
  );
  const [features, setFeatures] = React.useState(initialValues.features ?? "");
  const [season, setSeason] = React.useState(initialValues.season ?? "");
  const [yearManufactured, setYearManufactured] = React.useState(
    initialValues.year_manufactured != null
      ? String(initialValues.year_manufactured)
      : "",
  );

  const [isPrivate, setIsPrivate] = React.useState(
    Boolean(initialValues.is_private),
  );

  const [forSale, setForSale] = React.useState(Boolean(initialValues.for_sale));
  const [priceCad, setPriceCad] = React.useState(
    initialValues.price_cents != null
      ? String((initialValues.price_cents / 100).toFixed(2))
      : "",
  );
  const [priceCurrency, setPriceCurrency] = React.useState<
    (typeof CURRENCIES)[number]
  >(
    (CURRENCIES as readonly string[]).includes(
      String(initialValues.currency).toUpperCase(),
    )
      ? (String(
          initialValues.currency,
        ).toUpperCase() as (typeof CURRENCIES)[number])
      : CURRENCIES[0],
  );

  const [setName, setSetName] = React.useState(initialValues.set_name ?? "");
  const [cardNumber, setCardNumber] = React.useState(
    initialValues.card_number ?? "",
  );

  const [isGraded, setIsGraded] = React.useState(
    Boolean(initialValues.is_graded),
  );
  const [gradingCompany, setGradingCompany] = React.useState(
    initialValues.grading_company ?? "",
  );
  const [grade, setGrade] = React.useState(initialValues.grade ?? "");

  const [rookie, setRookie] = React.useState(Boolean(initialValues.rookie));
  const [autograph, setAutograph] = React.useState(
    Boolean(initialValues.autograph),
  );
  const [serialNumbered, setSerialNumbered] = React.useState(
    Boolean(initialValues.serial_numbered),
  );
  const [printRun, setPrintRun] = React.useState(
    initialValues.print_run != null ? String(initialValues.print_run) : "",
  );

  const [description, setDescription] = React.useState(
    initialValues.description ?? "",
  );
  const [notes, setNotes] = React.useState(initialValues.notes ?? "");

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: cleanedTitle,
          year: parsedYear,
          player: cleanedPlayer,
          manufacturer: cleanedManufacturer,
          team: team.trim() ? team.trim() : null,
          league: league.trim() ? league.trim() : null,
          is_sport: isSport,
          sport: isSport && effectiveSport ? effectiveSport : null,
          condition: condition.trim() ? condition.trim() : null,
          condition_detail: conditionDetail.trim()
            ? conditionDetail.trim()
            : null,
          country_of_origin: countryOfOrigin.trim()
            ? countryOfOrigin.trim()
            : null,
          original_licensed_reprint: originalLicensedReprint || null,
          parallel_variety: parallelVariety.trim()
            ? parallelVariety.trim()
            : null,
          features: features.trim() ? features.trim() : null,
          season: season.trim() ? season.trim() : null,
          year_manufactured: yearManufactured.trim()
            ? Number(yearManufactured)
            : null,
          is_private: isPrivate,
          for_sale: forSale,
          price_cents: forSale ? priceCents : null,
          currency: priceCurrency,
          set_name: setName.trim() ? setName.trim() : null,
          card_number: cardNumber.trim() ? cardNumber.trim() : null,
          is_graded: isGraded,
          grading_company:
            isGraded && gradingCompany.trim() ? gradingCompany.trim() : null,
          grade: isGraded && grade.trim() ? grade.trim() : null,
          rookie,
          autograph,
          serial_numbered: serialNumbered,
          print_run:
            serialNumbered && printRun.trim() ? Number(printRun) : null,
          description: description.trim() ? description.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to update.");
      }

      router.push(`/card/${cardId}`);
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
        <CardTitle>Edit card</CardTitle>
        <CardDescription>Update details for your card.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-6">
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
              <p className="text-xs text-muted-foreground">
                Write an eBay-style listing description (condition, highlights, flaws, anything notable).
              </p>
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

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/card/${cardId}`)}
            >
              Cancel
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
