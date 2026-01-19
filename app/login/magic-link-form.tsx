"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending..." : "Send magic link"}
    </Button>
  );
}

export function MagicLinkForm({
  action,
  defaultEmail,
  next,
  sent,
  error,
}: {
  action: (formData: FormData) => void;
  defaultEmail: string;
  next: string;
  sent: boolean;
  error: string | null;
}) {
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          defaultValue={defaultEmail}
          required
          autoComplete="email"
        />
      </div>

      {sent ? (
        <p className="text-sm text-muted-foreground">
          Magic link sent to{" "}
          <span className="font-medium text-foreground">{defaultEmail}</span>.
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <SubmitButton />
    </form>
  );
}
