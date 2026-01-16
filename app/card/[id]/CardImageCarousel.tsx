"use client";

import * as React from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

export function CardImageCarousel({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const [index, setIndex] = React.useState(0);

  const count = safeImages.length;
  const hasMany = count > 1;

  const goPrev = React.useCallback(() => {
    if (count === 0) return;
    setIndex((current) => (current - 1 + count) % count);
  }, [count]);

  const goNext = React.useCallback(() => {
    if (count === 0) return;
    setIndex((current) => (current + 1) % count);
  }, [count]);

  const activeSrc = safeImages[index];

  const pointerStartX = React.useRef<number | null>(null);

  return (
    <div className="grid gap-3">
      <div
        className="relative  mx-auto w-full max-w-[360px] h-fit overflow-hidden rounded-none border border-border bg-card"
        tabIndex={hasMany ? 0 : -1}
        onKeyDown={(event) => {
          if (!hasMany) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goPrev();
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goNext();
          }
        }}
        onPointerDown={(event) => {
          if (!hasMany) return;
          pointerStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (!hasMany) return;
          if (pointerStartX.current == null) return;

          const deltaX = event.clientX - pointerStartX.current;
          pointerStartX.current = null;

          // Simple swipe threshold.
          if (Math.abs(deltaX) < 40) return;
          if (deltaX > 0) goPrev();
          else goNext();
        }}
        aria-label={hasMany ? "Card image carousel" : "Card image"}
      >
        {activeSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeSrc}
            alt={title}
            className="aspect-[5/7] w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex aspect-[5/7] w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}

        {hasMany ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2"
              aria-label="Previous image"
              onClick={(event) => {
                event.preventDefault();
                goPrev();
              }}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Next image"
              onClick={(event) => {
                event.preventDefault();
                goNext();
              }}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>

      {hasMany ? (
        <div
          className="flex items-center justify-center gap-1"
          aria-label="Carousel position"
        >
          {safeImages.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              className={
                dotIndex === index
                  ? "h-1.5 w-5 rounded-full bg-foreground/60"
                  : "h-1.5 w-5 rounded-full bg-foreground/20"
              }
              aria-label={`Go to image ${dotIndex + 1}`}
              onClick={() => setIndex(dotIndex)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
