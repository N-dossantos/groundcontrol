"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore, cartSubtotal } from "@/lib/cart/store";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { useHydrated } from "@/lib/hooks/useHydrated";

const TIPO_LABEL: Record<string, string> = {
  camiseta: "Camiseta",
  short: "Short",
  conjunto: "Conjunto",
};

export function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const updateCantidad = useCartStore((state) => state.updateCantidad);
  const removeItem = useCartStore((state) => state.removeItem);
  const mounted = useHydrated();

  if (!mounted || !isOpen) return null;

  const subtotal = cartSubtotal(items);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop de fondo */}
      <div
        className="fixed inset-0 bg-gc-negro/80 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Panel Drawer */}
      <div className="relative flex w-full max-w-md flex-col bg-gc-negro border-l border-gc-carbon shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header del Cart Drawer */}
        <div className="flex h-16 items-center justify-between border-b border-gc-carbon px-6">
          <div className="flex items-center gap-2 font-headline text-base font-extrabold uppercase tracking-wide text-gc-blanco">
            <ShoppingBag size={20} className="text-gc-dorado" />
            <span>Tu Carrito ({items.length})</span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="rounded-lg p-2 text-gc-blanco/70 hover:bg-gc-carbon hover:text-gc-blanco transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full border border-gc-carbon bg-gc-carbon/30 p-6 text-gc-blanco/40">
              <ShoppingBag size={48} />
            </div>
            <h3 className="font-headline text-lg font-extrabold uppercase tracking-wide text-gc-blanco">
              Tu carrito está vacío
            </h3>
            <p className="mt-2 text-xs text-gc-blanco/60">
              Explorá nuestras camisetas, shorts y conjuntos personalizados.
            </p>
            <Link
              href="/catalogo"
              onClick={closeCart}
              className="mt-6 rounded-full border border-gc-blanco/30 px-6 py-2.5 font-headline text-xs font-bold uppercase tracking-wider text-gc-blanco hover:border-gc-blanco transition-colors"
            >
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-gc-carbon bg-gc-carbon/20 p-3.5 transition-colors hover:border-gc-carbon/80"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gc-negro">
                    <Image
                      src={item.imagenUrl ?? "/placeholder-product.svg"}
                      alt={item.nombre}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gc-dorado">
                          {TIPO_LABEL[item.tipo] ?? item.tipo} · Talle {item.talle}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label="Quitar del carrito"
                          className="text-gc-blanco/40 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h4 className="font-headline text-xs font-bold uppercase text-gc-blanco line-clamp-1 mt-0.5">
                        {item.nombre}
                      </h4>
                      {(item.nombreEstampado || item.numeroEstampado) && (
                        <p className="mt-1 text-[11px] text-gc-blanco/70 font-mono">
                          {[
                            item.nombreEstampado ? `Nombre: ${item.nombreEstampado}` : null,
                            item.numeroEstampado ? `N°: ${item.numeroEstampado}` : null,
                          ]
                            .filter(Boolean)
                            .join(" | ")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateCantidad(item.id, item.cantidad - 1)}
                          className="h-7 w-7 rounded border border-gc-carbon bg-gc-carbon/50 text-xs font-bold text-gc-blanco hover:bg-gc-carbon"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCantidad(item.id, item.cantidad + 1)}
                          className="h-7 w-7 rounded border border-gc-carbon bg-gc-carbon/50 text-xs font-bold text-gc-blanco hover:bg-gc-carbon"
                        >
                          +
                        </button>
                      </div>

                      <p className="font-stat text-sm font-bold text-gc-blanco">
                        {formatPrice(item.precioUnitario * item.cantidad)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer con Subtotal y CTA */}
            <div className="border-t border-gc-carbon p-6 bg-gc-negro space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gc-blanco/70 font-medium">Subtotal</span>
                <span className="font-stat text-xl font-bold text-gc-blanco">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-gc-blanco/50">
                Envíos por Andreani o retiro gratis en Canning coordinado luego de la compra.
              </p>

              <div className="space-y-2">
                <Link href="/checkout" onClick={closeCart} className="block w-full">
                  <Button className="w-full justify-center gap-2 py-3 text-xs font-headline font-extrabold uppercase tracking-wider">
                    Proceder al Checkout <ArrowRight size={16} />
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full text-center py-2 text-xs font-headline font-bold uppercase tracking-wider text-gc-blanco/60 hover:text-gc-blanco transition-colors"
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
