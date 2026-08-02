import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProductSlugs, getProductBySlug } from "@/lib/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartForm } from "@/components/product/AddToCartForm";

export const revalidate = 300;

const TIPO_LABEL: Record<string, string> = {
  camiseta: "Camiseta",
  short: "Short",
  conjunto: "Conjunto",
};

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.nombre,
    description: product.descripcion ?? undefined,
    openGraph: {
      title: product.nombre,
      description: product.descripcion ?? undefined,
      images: product.product_images[0] ? [product.product_images[0].url] : undefined,
    },
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.product_images} alt={product.nombre} />

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
            {TIPO_LABEL[product.tipo] ?? product.tipo}
            {product.club ? ` · ${product.club}` : ""}
            {product.temporada ? ` · ${product.temporada}` : ""}
          </p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold uppercase leading-tight">
            {product.nombre}
          </h1>

          {product.descripcion && (
            <p className="mt-4 text-sm leading-relaxed text-gc-blanco/70">
              {product.descripcion}
            </p>
          )}

          <div className="mt-6">
            <AddToCartForm product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
