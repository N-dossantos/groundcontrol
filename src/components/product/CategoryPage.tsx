import { getProducts, type ProductTipo } from "@/lib/products";
import { ProductGrid } from "./ProductGrid";

export async function CategoryPage({
  tipo,
  titulo,
  descripcion,
}: {
  tipo: ProductTipo;
  titulo: string;
  descripcion: string;
}) {
  const products = await getProducts({ tipo });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-headline text-3xl font-extrabold uppercase tracking-tight">
          {titulo}
        </h1>
        <p className="mt-2 text-sm text-gc-blanco/60">{descripcion}</p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
