"use client";

import { useState } from "react";
import Image from "next/image";
import type { ListingImage } from "@/types";

export function AdGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-zinc-100 text-muted">
        No image
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100">
        <Image
          src={active.url}
          alt={title}
          fill
          className="object-contain"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                index === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <Image src={image.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
