"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useWishlistStore } from "@/lib/wishlist/store";

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const router = useRouter();
  const userId = useWishlistStore((s) => s.userId);
  const status = useWishlistStore((s) => s.status);
  const isFavorited = useWishlistStore((s) => s.productIds.has(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "ready") return;

    if (!userId) {
      router.push("/login");
      return;
    }

    toggle(productId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status !== "ready"}
      aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={isFavorited}
      className={clsx(
        "rounded-full border border-gc-carbon bg-gc-negro/90 p-1.5 backdrop-blur transition-colors hover:border-gc-blanco disabled:opacity-40",
        className
      )}
    >
      <Heart
        size={16}
        className={isFavorited ? "fill-gc-dorado text-gc-dorado" : "text-gc-blanco/80"}
      />
    </button>
  );
}
