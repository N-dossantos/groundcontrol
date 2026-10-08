"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { Database } from "@/types/database.types";

type Variant = Database["public"]["Tables"]["product_variants"]["Row"];

export function VariantsManager({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const [nuevoTalle, setNuevoTalle] = useState("");
  const [nuevoSku, setNuevoSku] = useState("");
  const [nuevoStock, setNuevoStock] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleUpdateStock(id: string, stock: number) {
    setSavingId(id);
    const supabase = createClient();
    await supabase.from("product_variants").update({ stock }).eq("id", id);
    setSavingId(null);
    router.refresh();
  }

  async function handleUpdateStockMinimo(id: string, stock_minimo: number) {
    setSavingId(id);
    const supabase = createClient();
    await supabase.from("product_variants").update({ stock_minimo }).eq("id", id);
    setSavingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("product_variants").delete().eq("id", id);
    router.refresh();
  }

  async function handleAdd() {
    setError(null);
    if (!nuevoTalle.trim() || !nuevoSku.trim()) {
      setError("Completá talle y SKU.");
      return;
    }
    const supabase = createClient();
    const { error: insertError } = await supabase.from("product_variants").insert({
      product_id: productId,
      talle: nuevoTalle.trim().toUpperCase(),
      sku: nuevoSku.trim().toUpperCase(),
      stock: nuevoStock,
    });

    if (insertError) {
      setError(
        insertError.message.includes("duplicate")
          ? "Ya existe ese talle o SKU."
          : "No pudimos agregar el talle."
      );
      return;
    }

    setNuevoTalle("");
    setNuevoSku("");
    setNuevoStock(0);
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-gc-blanco/50">
          <tr>
            <th className="py-2">Talle</th>
            <th className="py-2">SKU</th>
            <th className="py-2">Stock</th>
            <th className="py-2">Stock mínimo</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id} className="border-t border-gc-carbon">
              <td className="py-2 font-bold">{variant.talle}</td>
              <td className="py-2 text-gc-blanco/60">{variant.sku}</td>
              <td className="py-2">
                <Input
                  type="number"
                  min={0}
                  defaultValue={variant.stock}
                  disabled={savingId === variant.id}
                  onBlur={(e) => handleUpdateStock(variant.id, Number(e.target.value) || 0)}
                  className="w-20 py-1.5"
                />
              </td>
              <td className="py-2">
                <Input
                  type="number"
                  min={0}
                  defaultValue={variant.stock_minimo}
                  disabled={savingId === variant.id}
                  onBlur={(e) =>
                    handleUpdateStockMinimo(variant.id, Number(e.target.value) || 0)
                  }
                  className="w-20 py-1.5"
                />
              </td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(variant.id)}
                  className="text-xs text-gc-blanco/50 hover:text-red-400"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-end gap-2">
        <div>
          <Label htmlFor="nuevoTalle">Talle</Label>
          <Input
            id="nuevoTalle"
            value={nuevoTalle}
            onChange={(e) => setNuevoTalle(e.target.value)}
            className="w-20"
          />
        </div>
        <div>
          <Label htmlFor="nuevoSku">SKU</Label>
          <Input
            id="nuevoSku"
            value={nuevoSku}
            onChange={(e) => setNuevoSku(e.target.value)}
            className="w-32"
          />
        </div>
        <div>
          <Label htmlFor="nuevoStock">Stock</Label>
          <Input
            id="nuevoStock"
            type="number"
            min={0}
            value={nuevoStock}
            onChange={(e) => setNuevoStock(Number(e.target.value) || 0)}
            className="w-20"
          />
        </div>
        <Button type="button" variant="secondary" onClick={handleAdd}>
          + Agregar
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
