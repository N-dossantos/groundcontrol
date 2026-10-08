import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { totalStock, isLowStock, averageRating, type ProductWithRelations } from "@/lib/products";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { Badge } from "@/components/ui/Badge";

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
  const rating = averageRating(product);

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
          <Badge variant="neutral" className="absolute left-2 top-2">
            Agotado
          </Badge>
        )}
        {ultimasUnidades && (
          <Badge variant="dorado" className="absolute left-2 top-2">
            Últimas unidades
          </Badge>
        )}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          <WishlistButton productId={product.id} />
          {product.permite_personalizacion && !agotado && (
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] tracking-wider">
              Nombre + N°
            </Badge>
          )}
        </div>
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
        {rating && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gc-blanco/60">
            <Star size={12} className="fill-gc-dorado text-gc-dorado" />
            {rating.average.toFixed(1)} ({rating.count})
          </p>
        )}
      </div>
    </Link>
  );
}
