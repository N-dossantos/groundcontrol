"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore, cartSubtotal } from "@/lib/cart/store";
import { recoverCartFromServer } from "@/lib/cart/recoverFromServer";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useHydrated } from "@/lib/hooks/useHydrated";

const TIPO_LABEL: Record<string, string> = {
  camiseta: "Camiseta",
  short: "Short",
  conjunto: "Conjunto",
};

export function CartView() {
  const items = useCartStore((state) => state.items);
  const updateCantidad = useCartStore((state) => state.updateCantidad);
  const removeItem = useCartStore((state) => state.removeItem);
  const mounted = useHydrated();

  useEffect(() => {
    if (!mounted || items.length > 0) return;
    if (new URLSearchParams(window.location.search).get("recuperar") !== "1") return;

    recoverCartFromServer().then((recovered) => {
      if (recovered) useCartStore.setState({ items: recovered });
    });
  }, [mounted, items.length]);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="mb-8 h-8 w-40" />
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4 rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
              <Skeleton className="h-24 w-24 shrink-0 rounded-md" />
              <div className="flex flex-1 flex-col justify-between gap-2">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          icon={ShoppingCart}
          title="Tu carrito está vacío"
          description="Todavía no agregaste productos. Explorá el catálogo y encontrá tu próxima camiseta."
          action={
            <Link href="/catalogo">
              <Button>Ver catálogo</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const subtotal = cartSubtotal(items);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Tu carrito
      </h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-gc-negro">
              <Image
                src={item.imagenUrl ?? "/placeholder-product.svg"}
                alt={item.nombre}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
                  {TIPO_LABEL[item.tipo] ?? item.tipo} · Talle {item.talle}
                </p>
                <Link
                  href={`/productos/${item.slug}`}
                  className="font-headline text-sm font-extrabold uppercase hover:underline"
                >
                  {item.nombre}
                </Link>
                {(item.nombreEstampado || item.numeroEstampado) && (
                  <p className="mt-1 text-xs text-gc-blanco/60">
                    {[item.nombreEstampado, item.numeroEstampado].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label htmlFor={`cantidad-${item.id}`} className="sr-only">
                    Cantidad
                  </label>
                  <input
                    id={`cantidad-${item.id}`}
                    type="number"
                    min={1}
                    max={item.stockDisponible}
                    value={item.cantidad}
                    onChange={(e) => updateCantidad(item.id, Number(e.target.value) || 1)}
                    className="w-16 rounded-md border border-gc-blanco/15 bg-gc-carbon px-2 py-1 text-sm text-gc-blanco"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Quitar del carrito"
                    className="text-gc-blanco/50 hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="font-stat font-bold">
                  {formatPrice(item.precioUnitario * item.cantidad)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-4 border-t border-gc-carbon pt-6">
        <div className="flex w-full max-w-xs items-center justify-between text-sm text-gc-blanco/70">
          <span>Subtotal</span>
          <span className="font-stat text-lg font-bold text-gc-blanco">
            {formatPrice(subtotal)}
          </span>
        </div>
        <p className="text-xs text-gc-blanco/50">
          El envío se calcula en el siguiente paso.
        </p>
        <Link href="/checkout" className="w-full max-w-xs">
          <Button className="w-full">Ir al checkout</Button>
        </Link>
      </div>
    </div>
  );
}
