"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ruler, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils/format";
import type { ProductWithRelations } from "@/lib/products";
import { SizeGuideModal } from "./SizeGuideModal";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491100000000";

export function AddToCartForm({ product }: { product: ProductWithRelations }) {
  const addItem = useCartStore((state) => state.addItem);
  const [talle, setTalle] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [nombreEstampado, setNombreEstampado] = useState("");
  const [numeroEstampado, setNumeroEstampado] = useState("");
  const [agregado, setAgregado] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const variante = useMemo(
    () => product.product_variants.find((v) => v.talle === talle) ?? null,
    [product.product_variants, talle]
  );

  function handleAgregar() {
    if (!variante) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      nombre: product.nombre,
      tipo: product.tipo,
      talle: variante.talle,
      productVariantId: variante.id,
      precioUnitario: product.precio,
      cantidad,
      imagenUrl: product.product_images[0]?.url,
      nombreEstampado: product.permite_personalizacion
        ? nombreEstampado.trim().toUpperCase() || undefined
        : undefined,
      numeroEstampado: product.permite_personalizacion
        ? numeroEstampado.trim() || undefined
        : undefined,
      stockDisponible: variante.stock,
    });

    setAgregado(true);
  }

  return (
    <div className="space-y-6">
      {/* Selección de Talle & Guía */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/70">
            Talle
          </p>
          <button
            type="button"
            onClick={() => setShowSizeGuide(true)}
            className="inline-flex items-center gap-1 text-xs font-bold text-gc-dorado hover:underline cursor-pointer"
          >
            <Ruler size={14} />
            Guía de talles
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {product.product_variants.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock === 0}
              onClick={() => {
                setTalle(v.talle);
                setAgregado(false);
              }}
              className={`h-11 min-w-11 rounded-lg border px-3.5 text-sm font-extrabold font-mono transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                talle === v.talle
                  ? "border-gc-blanco bg-gc-blanco text-gc-negro shadow-lg scale-105"
                  : "border-gc-blanco/25 text-gc-blanco hover:border-gc-blanco bg-gc-carbon/30"
              }`}
            >
              {v.talle}
            </button>
          ))}
        </div>
        {variante && variante.stock <= variante.stock_minimo && (
          <p className="mt-2 text-xs font-bold text-gc-dorado animate-pulse">
            ⚡ ¡Últimas {variante.stock} unidades en talle {variante.talle}!
          </p>
        )}
      </div>

      {/* Personalización (Nombre & Número) */}
      {product.permite_personalizacion && (
        <div className="space-y-4 rounded-xl border border-gc-carbon bg-gc-carbon/20 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gc-blanco">
            <Sparkles size={14} className="text-gc-dorado" />
            <span>Personalización Oficial</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nombreEstampado">Nombre a estampar</Label>
              <Input
                id="nombreEstampado"
                placeholder="Ej. MESSI"
                maxLength={20}
                value={nombreEstampado}
                onChange={(e) => setNombreEstampado(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="numeroEstampado">Número</Label>
              <Input
                id="numeroEstampado"
                placeholder="Ej. 10"
                maxLength={2}
                value={numeroEstampado}
                onChange={(e) => setNumeroEstampado(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>

          {/* Simulación Visual de Dorsal */}
          {(nombreEstampado.trim() || numeroEstampado.trim()) && (
            <div className="rounded-lg border border-gc-carbon bg-gc-negro p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gc-blanco/40 mb-2">
                Vista previa del Dorsal
              </p>
              <div className="mx-auto flex max-w-[180px] flex-col items-center justify-center rounded-md border border-gc-carbon bg-gradient-to-b from-gc-carbon/60 to-gc-negro px-4 py-5 shadow-inner">
                <span className="font-headline text-sm font-extrabold uppercase tracking-widest text-gc-blanco font-mono">
                  {nombreEstampado.trim().toUpperCase() || "NOMBRE"}
                </span>
                <span className="font-stat text-3xl font-black tracking-tighter text-gc-dorado mt-1">
                  {numeroEstampado.trim() || "10"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cantidad */}
      <div>
        <Label htmlFor="cantidad">Cantidad</Label>
        <Input
          id="cantidad"
          type="number"
          min={1}
          max={variante?.stock ?? 1}
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
          className="w-24"
        />
      </div>

      {/* Precio */}
      <div className="flex items-center gap-4">
        <p className="font-stat text-3xl font-bold text-gc-blanco">
          {formatPrice(product.precio)}
        </p>
      </div>

      {/* Acciones principales */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          onClick={handleAgregar}
          disabled={!variante}
          className="flex-1 py-3.5 text-xs font-headline font-extrabold uppercase tracking-wider justify-center gap-2"
        >
          <ShoppingBag size={18} />
          {variante ? "Agregar al carrito" : "Elegí un talle"}
        </Button>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Hola Ground Control 90! Quería consultar por: ${product.nombre}${
              talle ? ` en talle ${talle}` : ""
            }`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gc-carbon bg-gc-carbon/40 px-5 py-3 font-headline text-xs font-bold uppercase tracking-wider text-gc-blanco transition-colors hover:border-gc-blanco hover:bg-gc-carbon"
        >
          <MessageCircle size={16} className="text-gc-dorado" />
          Consultar por WhatsApp
        </a>
      </div>

      {agregado && (
        <p className="text-xs font-bold text-gc-dorado animate-fade-in">
          ► Agregado al carrito exitosamente.
        </p>
      )}

      {/* Modal Guía de Talles */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
      />
    </div>
  );
}
