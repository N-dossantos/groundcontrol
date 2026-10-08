"use client";

import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { useWishlistStore } from "@/lib/wishlist/store";
import type { ProductWithRelations } from "@/lib/products";

export function FavoritosGrid({ products }: { products: ProductWithRelations[] }) {
  const productIds = useWishlistStore((s) => s.productIds);
  const status = useWishlistStore((s) => s.status);

  const visible = status === "ready" ? products.filter((p) => productIds.has(p.id)) : products;

  if (visible.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-gc-blanco/60">
          Marcá productos con el corazón para encontrarlos acá más rápido.
        </p>
        <Link href="/catalogo">
          <Button className="mt-6">Ver catálogo</Button>
        </Link>
      </div>
    );
  }

  return <ProductGrid products={visible} />;
}
