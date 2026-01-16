"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => router.back()}
      className={className}
      aria-label="Go back"
    >
      <IconArrowLeft className="h-4 w-4" />
    </Button>
  );
}

export function NavbarBackButton({ className }: { className?: string }) {
  const pathname = usePathname();

  const show = React.useMemo(() => {
    if (!pathname) return false;
    return pathname.startsWith("/card/") || pathname.startsWith("/user/");
  }, [pathname]);

  if (!show) return null;

  return <BackButton className={className} />;
}
