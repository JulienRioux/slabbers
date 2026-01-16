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
  brand: string;
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
  const [brand, setBrand] = React.useState(initialValues.brand ?? "");

  const [isPrivate, setIsPrivate] = React.useState(
    Boolean(initialValues.is_private)
  );

  const [forSale, setForSale] = React.useState(Boolean(initialValues.for_sale));
  const [priceCad, setPriceCad] = React.useState(
    initialValues.price_cents != null
      ? String((initialValues.price_cents / 100).toFixed(2))
      : ""
  );

  const [setName, setSetName] = React.useState(initialValues.set_name ?? "");
  const [cardNumber, setCardNumber] = React.useState(
    initialValues.card_number ?? ""
  );

  const [isGraded, setIsGraded] = React.useState(
    Boolean(initialValues.is_graded)
  );
  const [gradingCompany, setGradingCompany] = React.useState(
    initialValues.grading_company ?? ""
  );
  const [grade, setGrade] = React.useState(initialValues.grade ?? "");

  const [rookie, setRookie] = React.useState(Boolean(initialValues.rookie));
  const [autograph, setAutograph] = React.useState(
    Boolean(initialValues.autograph)
  );
  const [serialNumbered, setSerialNumbered] = React.useState(
    Boolean(initialValues.serial_numbered)
  );
  const [printRun, setPrintRun] = React.useState(
    initialValues.print_run != null ? String(initialValues.print_run) : ""
  );

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedTitle = title.trim();
    const cleanedPlayer = player.trim();
    const cleanedBrand = brand.trim();
    const parsedYear = Number(year);

    if (
      !cleanedTitle ||
      !cleanedPlayer ||
      !cleanedBrand ||
      !Number.isFinite(parsedYear)
    ) {
      setError("Please fill in title, year, player, and brand.");
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

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: cleanedTitle,
          year: parsedYear,
          player: cleanedPlayer,
          brand: cleanedBrand,
          is_private: isPrivate,
          for_sale: forSale,
          price_cents: forSale ? priceCents : null,
          currency: initialValues.currency ?? "CAD",
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
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
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
              <div className="grid gap-2">
                <Label htmlFor="price">Price (CAD)</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  value={priceCad}
                  onChange={(e) => setPriceCad(e.target.value)}
                  placeholder="e.g. 250"
                  required
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-md border border-border p-4">
            <p className="text-sm font-medium">Optional</p>

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
                    <Select value={grade || undefined} onValueChange={(next) => setGrade(next)}>
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
