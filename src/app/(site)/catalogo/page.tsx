import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getClubes, type ProductTipo } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";

export const metadata: Metadata = { title: "Catálogo" };

type SearchParams = {
  tipo?: string;
  club?: string;
  talle?: string;
  q?: string;
};

async function CatalogoResults({ searchParams }: { searchParams: SearchParams }) {
  const [products, clubes] = await Promise.all([
    getProducts({
      tipo: (searchParams.tipo as ProductTipo) || undefined,
      club: searchParams.club || undefined,
      talle: searchParams.talle || undefined,
      q: searchParams.q || undefined,
    }),
    getClubes(),
  ]);

  return (
    <>
      <ProductFilters clubes={clubes} />
      <ProductGrid products={products} />
    </>
  );
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-center font-headline text-3xl font-extrabold uppercase tracking-tight">
        Catálogo
      </h1>
      <Suspense>
        <CatalogoResults searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  );
}
