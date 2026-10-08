import { PackageSearch } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProductWithRelations } from "@/lib/products";

export function ProductGrid({
  products,
  emptyTitle = "Sin resultados",
  emptyDescription = "No encontramos productos con esos filtros.",
  emptyAction,
}: {
  products: ProductWithRelations[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
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
