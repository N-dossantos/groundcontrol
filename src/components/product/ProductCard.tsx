import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/format";
import { totalStock, isLowStock, type ProductWithRelations } from "@/lib/products";

const TIPO_LABEL: Record<string, string> = {
  camiseta: "Camiseta",
  short: "Short",
  conjunto: "Conjunto",
};

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const stock = totalStock(product);
  const agotado = stock === 0;
  const ultimasUnidades = !agotado && product.product_variants.some(isLowStock);
  const image = product.product_images[0];

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-gc-carbon bg-gc-carbon/20 transition-colors hover:border-gc-blanco/30"
    >
      <div className="relative aspect-square overflow-hidden bg-gc-negro">
        <Image
          src={image?.url ?? "/placeholder-product.svg"}
          alt={image?.alt_text ?? product.nombre}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {agotado && (
          <span className="absolute left-2 top-2 rounded bg-gc-negro/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gc-blanco/70">
            Agotado
          </span>
        )}
        {ultimasUnidades && (
          <span className="absolute left-2 top-2 rounded bg-gc-dorado px-2 py-1 text-xs font-bold uppercase tracking-wide text-gc-negro">
            Últimas unidades
          </span>
        )}
        {product.permite_personalizacion && !agotado && (
          <span className="absolute right-2 top-2 rounded-full border border-gc-carbon bg-gc-negro/90 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-gc-dorado backdrop-blur">
            Nombre + N°
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
          {TIPO_LABEL[product.tipo] ?? product.tipo}
          {product.club ? ` · ${product.club}` : ""}
        </p>
        <h3 className="mt-1 font-headline text-sm font-extrabold uppercase leading-snug">
          {product.nombre}
        </h3>
        <p className="mt-2 font-stat text-lg font-bold text-gc-blanco">
          {formatPrice(product.precio)}
        </p>
      </div>
    </Link>
  );
}
