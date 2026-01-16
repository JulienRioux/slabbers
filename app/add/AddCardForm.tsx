"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

export function AddCardForm({ userEmail: _userEmail }: Props) {
  const router = useRouter();
  void _userEmail;

  // Pre-populated defaults for MVP/dev testing.
  // Note: browsers do not allow pre-filling file inputs.
  const [title, setTitle] = React.useState("Sample Card Title");
  const [year, setYear] = React.useState("2003");
  const [player, setPlayer] = React.useState("Sample Player");
  const [brand, setBrand] = React.useState("Sample Brand");

  const [isPrivate, setIsPrivate] = React.useState(false);

  const [forSale, setForSale] = React.useState(true);
  const [priceCad, setPriceCad] = React.useState("250");

  const [setName, setSetName] = React.useState("Sample Set");
  const [cardNumber, setCardNumber] = React.useState("1");

  const [isGraded, setIsGraded] = React.useState(true);
  const [gradingCompany, setGradingCompany] = React.useState("PSA");
  const [grade, setGrade] = React.useState("10");

  const [rookie, setRookie] = React.useState(true);
  const [autograph, setAutograph] = React.useState(true);
  const [serialNumbered, setSerialNumbered] = React.useState(true);
  const [printRun, setPrintRun] = React.useState("99");

  const [files, setFiles] = React.useState<File[]>([]);

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

    if (files.length === 0) {
      setError("Please upload at least one image.");
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
      const formData = new FormData();
      formData.set("title", cleanedTitle);
      formData.set("year", String(parsedYear));
      formData.set("player", cleanedPlayer);
      formData.set("brand", cleanedBrand);
      formData.set("is_private", String(isPrivate));

      formData.set("for_sale", String(forSale));
      if (forSale && priceCents) {
        formData.set("price_cents", String(priceCents));
      }
      formData.set("currency", "CAD");

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

      for (const f of files) {
        formData.append("images", f);
      }

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

          <div className="grid gap-2">
            <Label htmlFor="images">Images</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
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
                      value={gradingCompany}
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
                    <Select value={grade} onValueChange={(next) => setGrade(next)}>
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

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Add card"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
