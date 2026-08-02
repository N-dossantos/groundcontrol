"use client";

import { useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import type { ProductImage } from "@/lib/products";

export function ProductGallery({
  images,
  alt,
}: {
  images: ProductImage[];
  alt: string;
}) {
  const gallery = images.length > 0 ? images : null;
  const [active, setActive] = useState(0);
  const current = gallery?.[active];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gc-negro">
        <Image
          src={current?.url ?? "/placeholder-product.svg"}
          alt={current?.alt_text ?? alt}
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className="object-cover"
          priority
        />
      </div>

      {gallery && gallery.length > 1 && (
        <div className="mt-3 flex gap-2">
          {gallery.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              className={clsx(
                "relative h-16 w-16 overflow-hidden rounded-md border",
                index === active ? "border-gc-blanco" : "border-gc-blanco/20"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text ?? alt}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
