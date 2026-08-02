import { ProductCard } from "./ProductCard";
import type { ProductWithRelations } from "@/lib/products";

export function ProductGrid({ products }: { products: ProductWithRelations[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gc-blanco/60">
        No encontramos productos con esos filtros.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
