"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore, cartItemCount } from "@/lib/cart/store";
import { useHydrated } from "@/lib/hooks/useHydrated";

export function CartBadge() {
  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const mounted = useHydrated();

  const count = mounted ? cartItemCount(items) : 0;

  return (
    <button
      type="button"
      onClick={toggleCart}
      aria-label="Abrir Carrito"
      className="relative text-gc-blanco/80 transition-colors hover:text-gc-blanco cursor-pointer"
    >
      <ShoppingBag size={22} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gc-dorado px-1 text-[10px] font-bold text-gc-negro">
          {count}
        </span>
      )}
    </button>
  );
}
