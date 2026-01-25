"use client";

import * as React from "react";
import { IconArrowsMaximize, IconX } from "@tabler/icons-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

export function CardImageCarousel({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const slides = safeImages.length ? safeImages : [""];
  const hasMany = slides.length > 1;

  React.useEffect(() => {
    if (!isFullscreen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullscreen]);

  React.useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className="grid gap-3">
      <Carousel
        className="relative mx-auto w-full max-w-[360px]"
        opts={{ loop: hasMany }}
        aria-label={hasMany ? "Card image carousel" : "Card image"}
      >
        <div className="relative w-full overflow-hidden border border-border bg-card">
          <div className="absolute right-2 top-2 z-10">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => setIsFullscreen(true)}
              aria-label="Open fullscreen"
            >
              <IconArrowsMaximize />
            </Button>
          </div>

          <CarouselContent className="-ml-0">
            {slides.map((src, slideIndex) => (
              <CarouselItem key={`${src}-${slideIndex}`} className="pl-0">
                {src ? (
                  <div className="flex w-full items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={title}
                      className="h-auto w-full object-contain"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[5/7] w-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>

          {hasMany ? (
            <>
              <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
              <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
            </>
          ) : null}
        </div>
      </Carousel>

      {isFullscreen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen card images"
        >
          <div className="absolute right-4 top-4 z-10">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen"
            >
              <IconX />
            </Button>
          </div>

          <Carousel
            className="relative mx-auto w-full max-w-[980px]"
            opts={{ loop: hasMany }}
            aria-label={hasMany ? "Card image carousel" : "Card image"}
          >
            <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card">
              <CarouselContent className="-ml-0">
                {slides.map((src, slideIndex) => (
                  <CarouselItem key={`fullscreen-${src}-${slideIndex}`} className="pl-0">
                    {src ? (
                      <div className="flex w-full items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={title}
                          className="h-auto max-h-[85vh] w-full object-contain"
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[5/7] w-full items-center justify-center text-sm text-muted-foreground">
                        No image
                      </div>
                    )}
                  </CarouselItem>
                ))}
              </CarouselContent>

              {hasMany ? (
                <>
                  <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2" />
                  <CarouselNext className="right-4 top-1/2 -translate-y-1/2" />
                </>
              ) : null}
            </div>
          </Carousel>
        </div>
      ) : null}
    </div>
  );
}
