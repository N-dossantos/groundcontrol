"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations/checkout";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import type { Database } from "@/types/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

export function AddressesManager({
  userId,
  addresses,
}: {
  userId: string;
  addresses: Address[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("addresses").delete().eq("id", id);
    router.refresh();
  }

  async function handleSetDefault(id: string) {
    const supabase = createClient();
    await supabase.from("addresses").update({ es_predeterminada: false }).eq("user_id", userId);
    await supabase.from("addresses").update({ es_predeterminada: true }).eq("id", id);
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-4">
      {addresses.length === 0 && (
        <p className="text-sm text-gc-blanco/60">No tenés direcciones guardadas.</p>
      )}

      {addresses.map((address) => (
        <div
          key={address.id}
          className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="text-sm">
              <p className="font-bold">
                {address.calle} {address.numero}
                {address.piso_depto ? `, ${address.piso_depto}` : ""}
              </p>
              <p className="text-gc-blanco/60">
                {address.ciudad}, {address.provincia} ({address.codigo_postal})
              </p>
              {address.es_predeterminada && (
                <span className="mt-1 inline-block rounded bg-gc-dorado px-2 py-0.5 text-xs font-bold text-gc-negro">
                  Predeterminada
                </span>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
              <button
                type="button"
                onClick={() => openEdit(address)}
                className="text-gc-blanco/60 hover:text-gc-blanco"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                className="text-gc-blanco/60 hover:text-red-400"
              >
                Eliminar
              </button>
              {!address.es_predeterminada && (
                <button
                  type="button"
                  onClick={() => handleSetDefault(address.id)}
                  className="text-gc-blanco/60 hover:text-gc-dorado"
                >
                  Usar como predeterminada
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {showForm ? (
        <AddressForm
          userId={userId}
          initial={editing}
          onDone={() => {
            setShowForm(false);
            router.refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Button variant="secondary" onClick={openNew}>
          + Agregar dirección
        </Button>
      )}
    </div>
  );
}

function AddressForm({
  userId,
  initial,
  onDone,
  onCancel,
}: {
  userId: string;
  initial: Address | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial
      ? {
          calle: initial.calle,
          numero: initial.numero ?? "",
          pisoDepto: initial.piso_depto ?? "",
          ciudad: initial.ciudad,
          provincia: initial.provincia,
          codigoPostal: initial.codigo_postal,
        }
      : undefined,
  });

  async function onSubmit(data: AddressInput) {
    const supabase = createClient();
    const payload = {
      user_id: userId,
      calle: data.calle,
      numero: data.numero,
      piso_depto: data.pisoDepto,
      ciudad: data.ciudad,
      provincia: data.provincia,
      codigo_postal: data.codigoPostal,
    };

    if (initial) {
      await supabase.from("addresses").update(payload).eq("id", initial.id);
    } else {
      await supabase.from("addresses").insert(payload);
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
        <div className="col-span-2">
          <Label htmlFor="calle">Calle</Label>
          <Input id="calle" error={errors.calle?.message} {...register("calle")} />
          <FieldError message={errors.calle?.message} />
        </div>
        <div>
          <Label htmlFor="numero">Número</Label>
          <Input id="numero" {...register("numero")} />
        </div>
        <div>
          <Label htmlFor="pisoDepto">Piso / Depto</Label>
          <Input id="pisoDepto" {...register("pisoDepto")} />
        </div>
        <div>
          <Label htmlFor="ciudad">Ciudad</Label>
          <Input id="ciudad" error={errors.ciudad?.message} {...register("ciudad")} />
          <FieldError message={errors.ciudad?.message} />
        </div>
        <div>
          <Label htmlFor="provincia">Provincia</Label>
          <Input id="provincia" error={errors.provincia?.message} {...register("provincia")} />
          <FieldError message={errors.provincia?.message} />
        </div>
        <div>
          <Label htmlFor="codigoPostal">Código postal</Label>
          <Input
            id="codigoPostal"
            error={errors.codigoPostal?.message}
            {...register("codigoPostal")}
          />
          <FieldError message={errors.codigoPostal?.message} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          Guardar
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
