"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useWishlistStore } from "@/lib/wishlist/store";
import type { ProductWithRelations } from "@/lib/products";

export function FavoritosGrid({ products }: { products: ProductWithRelations[] }) {
  const productIds = useWishlistStore((s) => s.productIds);
  const status = useWishlistStore((s) => s.status);

  const visible = status === "ready" ? products.filter((p) => productIds.has(p.id)) : products;

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Sin favoritos todavía"
        description="Marcá productos con el corazón para encontrarlos acá más rápido."
        action={
          <Link href="/catalogo">
            <Button>Ver catálogo</Button>
          </Link>
        }
      />
    );
  }

  return <ProductGrid products={visible} />;
}
