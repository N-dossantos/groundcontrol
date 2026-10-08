import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getProducts, getClubes, type ProductTipo } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";
import { Pagination } from "@/components/product/Pagination";

export const metadata: Metadata = { title: "Catálogo" };

type SearchParams = {
  tipo?: string;
  club?: string;
  talle?: string;
  q?: string;
  page?: string;
};

async function CatalogoResults({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [{ products, total, pageSize }, clubes] = await Promise.all([
    getProducts({
      tipo: (searchParams.tipo as ProductTipo) || undefined,
      club: searchParams.club || undefined,
      talle: searchParams.talle || undefined,
      q: searchParams.q || undefined,
      page,
    }),
    getClubes(),
  ]);

  const hasFilters = Boolean(
    searchParams.tipo || searchParams.club || searchParams.talle || searchParams.q
  );

  return (
    <>
      <ProductFilters clubes={clubes} />
      <ProductGrid
        products={products}
        emptyDescription={
          hasFilters
            ? "No encontramos productos con esos filtros. Probá ajustando la búsqueda."
            : "Todavía no hay productos cargados."
        }
        emptyAction={
          hasFilters ? (
            <Link
              href="/catalogo"
              className="rounded-full border border-gc-blanco/30 px-6 py-2.5 font-headline text-xs font-extrabold uppercase tracking-wide text-gc-blanco transition-colors hover:border-gc-blanco"
            >
              Limpiar filtros
            </Link>
          ) : undefined
        }
      />
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
        searchParams={searchParams}
      />
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
