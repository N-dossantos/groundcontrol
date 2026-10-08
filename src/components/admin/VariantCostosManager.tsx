"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { Database } from "@/types/database.types";

type ProductVariantCosto = Database["public"]["Tables"]["product_variant_costos"]["Row"];
type Variant = Database["public"]["Tables"]["product_variants"]["Row"] & {
  costos: ProductVariantCosto | null;
};

const ESTADOS_PRODUCCION = [
  { value: "", label: "— Sin estado —" },
  { value: "pedido", label: "Pedido" },
  { value: "en_produccion", label: "En producción" },
  { value: "recibido", label: "Recibido" },
] as const;

type RowState = {
  costo: string;
  proveedor: string;
  estado_produccion: string;
  fecha_llegada_estimada: string;
  cantidad_comprada: string;
};

function rowStateFromCosto(costo: ProductVariantCosto | null): RowState {
  return {
    costo: costo?.costo != null ? String(costo.costo) : "",
    proveedor: costo?.proveedor ?? "",
    estado_produccion: costo?.estado_produccion ?? "",
    fecha_llegada_estimada: costo?.fecha_llegada_estimada ?? "",
    cantidad_comprada: costo?.cantidad_comprada != null ? String(costo.cantidad_comprada) : "",
  };
}

function formatMargen(precio: number, costo: string): string {
  if (costo.trim() === "") return "—";
  const costoNum = Number(costo);
  if (Number.isNaN(costoNum)) return "—";
  const margen = precio - costoNum;
  const porcentaje = precio > 0 ? Math.round((margen / precio) * 100) : 0;
  return `$${margen.toFixed(2)} (${porcentaje}%)`;
}

export function VariantCostosManager({
  variants,
  precio,
}: {
  variants: Variant[];
  precio: number;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(variants.map((v) => [v.id, rowStateFromCosto(v.costos)]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  function updateRow(variantId: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [variantId]: { ...prev[variantId], ...patch } }));
  }

  async function handleSave(variantId: string) {
    const row = rows[variantId];
    setSavingId(variantId);
    const supabase = createClient();
    await supabase.from("product_variant_costos").upsert(
      {
        variant_id: variantId,
        costo: row.costo.trim() === "" ? null : Number(row.costo),
        proveedor: row.proveedor.trim() || null,
        estado_produccion: row.estado_produccion || null,
        fecha_llegada_estimada: row.fecha_llegada_estimada || null,
        cantidad_comprada:
          row.cantidad_comprada.trim() === "" ? null : Number(row.cantidad_comprada),
      },
      { onConflict: "variant_id" }
    );
    setSavingId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-xs uppercase text-gc-blanco/50">
          <tr>
            <th className="py-2 pr-3">Talle</th>
            <th className="py-2 pr-3">Costo</th>
            <th className="py-2 pr-3">Proveedor</th>
            <th className="py-2 pr-3">Estado</th>
            <th className="py-2 pr-3">Llegada est.</th>
            <th className="py-2 pr-3">Cant. comprada</th>
            <th className="py-2 pr-3">Margen</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => {
            const row = rows[variant.id];
            const saving = savingId === variant.id;
            return (
              <tr key={variant.id} className="border-t border-gc-carbon">
                <td className="py-2 pr-3 font-bold">{variant.talle}</td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.costo}
                    disabled={saving}
                    onChange={(e) => updateRow(variant.id, { costo: e.target.value })}
                    className="w-24 rounded-md border border-gc-blanco/15 bg-gc-carbon px-2 py-1.5 text-sm text-gc-blanco"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="text"
                    value={row.proveedor}
                    disabled={saving}
                    onChange={(e) => updateRow(variant.id, { proveedor: e.target.value })}
                    className="w-32 rounded-md border border-gc-blanco/15 bg-gc-carbon px-2 py-1.5 text-sm text-gc-blanco"
                  />
                </td>
                <td className="py-2 pr-3">
                  <select
                    value={row.estado_produccion}
                    disabled={saving}
                    onChange={(e) => updateRow(variant.id, { estado_produccion: e.target.value })}
                    className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-2 py-1.5 text-sm text-gc-blanco"
                  >
                    {ESTADOS_PRODUCCION.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="date"
                    value={row.fecha_llegada_estimada}
                    disabled={saving}
                    onChange={(e) =>
                      updateRow(variant.id, { fecha_llegada_estimada: e.target.value })
                    }
                    className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-2 py-1.5 text-sm text-gc-blanco"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    value={row.cantidad_comprada}
                    disabled={saving}
                    onChange={(e) =>
                      updateRow(variant.id, { cantidad_comprada: e.target.value })
                    }
                    className="w-20 rounded-md border border-gc-blanco/15 bg-gc-carbon px-2 py-1.5 text-sm text-gc-blanco"
                  />
                </td>
                <td className="py-2 pr-3 text-gc-blanco/70">{formatMargen(precio, row.costo)}</td>
                <td className="py-2">
                  <Button
                    type="button"
                    variant="secondary"
                    isLoading={saving}
                    onClick={() => handleSave(variant.id)}
                    className="px-4 py-1.5 text-xs"
                  >
                    Guardar
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
