"use client";

import * as React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function CardImageCarousel({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];

  const slides = safeImages.length ? safeImages : [""];
  const hasMany = slides.length > 1;

  return (
    <div className="grid gap-3">
      <Carousel
        className="relative mx-auto w-full max-w-[360px]"
        opts={{ loop: hasMany }}
        aria-label={hasMany ? "Card image carousel" : "Card image"}
      >
        <div className="relative aspect-[5/7] w-full overflow-hidden border border-border bg-card">
          <div className="absolute inset-0">
            <CarouselContent className="-ml-0 h-full">
              {slides.map((src, slideIndex) => (
                <CarouselItem
                  key={`${src}-${slideIndex}`}
                  className="pl-0 h-full"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={title}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>

          {hasMany ? (
            <>
              <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
              <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
            </>
          ) : null}
        </div>
      </Carousel>
    </div>
  );
}
