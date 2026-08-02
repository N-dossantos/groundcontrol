"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { nuevoProductoSchema, type NuevoProductoInput } from "@/lib/validations/product";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/slug";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

export function NuevoProductoForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NuevoProductoInput>({
    resolver: zodResolver(nuevoProductoSchema),
    defaultValues: { tipo: "camiseta", permite_personalizacion: true },
  });

  async function onSubmit(data: NuevoProductoInput) {
    setFormError(null);
    const supabase = createClient();

    const slug = slugify(data.nombre);
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        nombre: data.nombre,
        slug,
        tipo: data.tipo,
        club: data.club || null,
        precio: data.precio,
        permite_personalizacion: data.permite_personalizacion,
        activo: false,
      })
      .select()
      .single();

    if (error || !product) {
      setFormError(
        error?.message.includes("duplicate")
          ? "Ya existe un producto con un nombre/slug muy similar."
          : "No pudimos crear el producto."
      );
      return;
    }

    router.push(`/admin/productos/${product.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" error={errors.nombre?.message} {...register("nombre")} />
        <FieldError message={errors.nombre?.message} />
      </div>

      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <select
          id="tipo"
          {...register("tipo")}
          className="w-full rounded-md border border-gc-blanco/15 bg-gc-carbon px-4 py-3 text-sm text-gc-blanco"
        >
          <option value="camiseta">Camiseta</option>
          <option value="short">Short</option>
          <option value="conjunto">Conjunto</option>
        </select>
      </div>

      <div>
        <Label htmlFor="club">Club</Label>
        <Input id="club" {...register("club")} />
      </div>

      <div>
        <Label htmlFor="precio">Precio (ARS)</Label>
        <Input
          id="precio"
          type="number"
          step="1"
          error={errors.precio?.message}
          {...register("precio", { valueAsNumber: true })}
        />
        <FieldError message={errors.precio?.message} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("permite_personalizacion")} />
        Permite personalización (nombre y número)
      </label>

      {formError && <p className="text-sm text-red-400">{formError}</p>}

      <Button type="submit" isLoading={isSubmitting}>
        Crear y continuar
      </Button>
      <p className="text-xs text-gc-blanco/50">
        El producto se crea inactivo. Vas a poder agregar imágenes, talles/stock y
        activarlo en la siguiente pantalla.
      </p>
    </form>
  );
}
