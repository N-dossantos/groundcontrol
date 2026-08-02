import Link from "next/link";
import { getFeaturedProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { QuienesSomos } from "@/components/QuienesSomos";

export const revalidate = 60;

export default async function HomePage() {
  const destacados = await getFeaturedProducts();

  return (
    <div>
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1 className="font-headline text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-6xl">
          Control en tu <span className="text-gradient-cromo">movimiento</span>
        </h1>
        <p className="max-w-xl text-base text-gc-blanco/70 sm:text-lg">
          La base del rendimiento para todos los deportistas. Camisetas y
          conjuntos de fútbol personalizados con nombre y número.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/catalogo"
            className="rounded-full bg-gc-blanco px-8 py-3 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-negro transition-opacity hover:opacity-90"
          >
            Ver catálogo
          </Link>
          <Link
            href="/conjuntos"
            className="rounded-full border border-gc-blanco/30 px-8 py-3 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco transition-colors hover:border-gc-blanco"
          >
            Conjuntos
          </Link>
        </div>
      </section>

      <section className="border-t border-gc-carbon bg-gc-carbon/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3">
          <div className="text-center">
            <p className="font-stat text-3xl font-bold text-gc-dorado">100%</p>
            <p className="mt-1 text-sm uppercase tracking-wide text-gc-blanco/70">
              Personalizado
            </p>
          </div>
          <div className="text-center">
            <p className="font-stat text-3xl font-bold text-gc-dorado">+21.000</p>
            <p className="mt-1 text-sm uppercase tracking-wide text-gc-blanco/70">
              Hinchas en Instagram
            </p>
          </div>
          <div className="text-center">
            <p className="font-stat text-3xl font-bold text-gc-dorado">AR</p>
            <p className="mt-1 text-sm uppercase tracking-wide text-gc-blanco/70">
              Orgullo argentino
            </p>
          </div>
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-center font-headline text-2xl font-extrabold uppercase tracking-wide">
            Destacados
          </h2>
          <ProductGrid products={destacados} />
        </section>
      )}

      <QuienesSomos />
    </div>
  );
}
