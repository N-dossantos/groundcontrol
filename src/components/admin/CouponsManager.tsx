"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { couponSchema, type CouponInput } from "@/lib/validations/coupon";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import type { Database } from "@/types/database.types";

type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  async function handleToggleActivo(coupon: Coupon) {
    const supabase = createClient();
    await supabase.from("coupons").update({ activo: !coupon.activo }).eq("id", coupon.id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("coupons").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="overflow-hidden rounded-lg border border-gc-carbon">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gc-carbon bg-gc-carbon/30 text-xs uppercase text-gc-blanco/60">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-gc-carbon/50">
                <td className="px-4 py-3 font-bold">{coupon.codigo}</td>
                <td className="px-4 py-3 font-stat">
                  {coupon.tipo === "porcentaje" ? `${coupon.valor}%` : formatPrice(coupon.valor)}
                </td>
                <td className="px-4 py-3">
                  {coupon.usos_actuales}
                  {coupon.usos_maximos ? ` / ${coupon.usos_maximos}` : ""}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActivo(coupon)}
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      coupon.activo ? "bg-gc-dorado text-gc-negro" : "bg-gc-carbon text-gc-blanco/60"
                    }`}
                  >
                    {coupon.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(coupon.id)}
                    className="text-xs text-gc-blanco/50 hover:text-red-400"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm ? (
        <NewCouponForm
          onDone={() => {
            setShowForm(false);
            router.refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          + Nuevo cupón
        </Button>
      )}
    </div>
  );
}

function NewCouponForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    defaultValues: { tipo: "porcentaje", montoMinimoCompra: 0, activo: true },
  });

  async function onSubmit(data: CouponInput) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.from("coupons").insert({
      codigo: data.codigo.toUpperCase(),
      tipo: data.tipo,
      valor: data.valor,
      fecha_inicio: data.fechaInicio || null,
      fecha_fin: data.fechaFin || null,
      usos_maximos: data.usosMaximos || null,
      monto_minimo_compra: data.montoMinimoCompra,
      activo: data.activo,
    });

    if (error) {
      setFormError(
        error.message.includes("duplicate") ? "Ya existe un cupón con ese código." : "No pudimos crear el cupón."
      );
      return;
    }
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4"
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="codigo">Código</Label>
          <Input id="codigo" error={errors.codigo?.message} {...register("codigo")} />
          <FieldError message={errors.codigo?.message} />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <select
            id="tipo"
            {...register("tipo")}
            className="w-full rounded-md border border-gc-blanco/15 bg-gc-carbon px-4 py-3 text-sm text-gc-blanco"
          >
            <option value="porcentaje">Porcentaje</option>
            <option value="monto_fijo">Monto fijo</option>
          </select>
        </div>
        <div>
          <Label htmlFor="valor">Valor</Label>
          <Input
            id="valor"
            type="number"
            step="1"
            error={errors.valor?.message}
            {...register("valor", { valueAsNumber: true })}
          />
          <FieldError message={errors.valor?.message} />
        </div>
        <div>
          <Label htmlFor="montoMinimoCompra">Compra mínima</Label>
          <Input
            id="montoMinimoCompra"
            type="number"
            step="1"
            {...register("montoMinimoCompra", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="usosMaximos">Usos máximos</Label>
          <Input id="usosMaximos" type="number" step="1" {...register("usosMaximos", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="fechaFin">Vence</Label>
          <Input id="fechaFin" type="date" {...register("fechaFin")} />
        </div>
      </div>
      {formError && <p className="text-sm text-red-400">{formError}</p>}
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          Crear cupón
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
