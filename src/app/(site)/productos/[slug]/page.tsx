import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllProductSlugs,
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
  averageRating,
  totalStock,
} from "@/lib/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductGrid } from "@/components/product/ProductGrid";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

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

  const [reviews, relatedProducts] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product),
  ]);
  const rating = averageRating(product);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    description: product.descripcion ?? undefined,
    image: product.product_images.map((img) => img.url),
    url: `${siteUrl}/productos/${product.slug}`,
    brand: { "@type": "Brand", name: product.club || "Ground Control 90" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/productos/${product.slug}`,
      priceCurrency: "ARS",
      price: product.precio.toFixed(2),
      availability:
        totalStock(product) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average.toFixed(1),
            reviewCount: rating.count,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.product_images} alt={product.nombre} />

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
            {TIPO_LABEL[product.tipo] ?? product.tipo}
            {product.club ? ` · ${product.club}` : ""}
            {product.temporada ? ` · ${product.temporada}` : ""}
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="font-headline text-3xl font-extrabold uppercase leading-tight">
              {product.nombre}
            </h1>
            <WishlistButton productId={product.id} className="shrink-0" />
          </div>
          {rating && (
            <p className="mt-1 text-sm text-gc-dorado">
              ★ {rating.average.toFixed(1)} · {rating.count}{" "}
              {rating.count === 1 ? "reseña" : "reseñas"}
            </p>
          )}

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

      <ProductReviews productId={product.id} initialReviews={reviews} />

      {relatedProducts.length > 0 && (
        <section className="mt-12 border-t border-gc-carbon pt-8">
          <h2 className="mb-6 font-headline text-xl font-extrabold uppercase tracking-wide">
            También te puede interesar
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
