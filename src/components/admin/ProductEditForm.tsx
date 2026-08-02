"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema, type ProductoInput } from "@/lib/validations/product";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

export function ProductEditForm({
  productId,
  initial,
}: {
  productId: string;
  initial: ProductoInput;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductoInput>({ resolver: zodResolver(productoSchema), defaultValues: initial });

  async function onSubmit(data: ProductoInput) {
    setFormError(null);
    setGuardado(false);
    const supabase = createClient();

    const { error } = await supabase
      .from("products")
      .update({
        nombre: data.nombre,
        slug: data.slug,
        tipo: data.tipo,
        club: data.club || null,
        liga: data.liga || null,
        temporada: data.temporada || null,
        descripcion: data.descripcion || null,
        precio: data.precio,
        permite_personalizacion: data.permite_personalizacion,
        activo: data.activo,
        destacado: data.destacado,
      })
      .eq("id", productId);

    if (error) {
      setFormError("No pudimos guardar los cambios.");
      return;
    }

    setGuardado(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4" noValidate>
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" error={errors.nombre?.message} {...register("nombre")} />
        <FieldError message={errors.nombre?.message} />
      </div>

      <div>
        <Label htmlFor="slug">Slug (URL)</Label>
        <Input id="slug" error={errors.slug?.message} {...register("slug")} />
        <FieldError message={errors.slug?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
          <Label htmlFor="liga">Liga</Label>
          <Input id="liga" {...register("liga")} />
        </div>
        <div>
          <Label htmlFor="temporada">Temporada</Label>
          <Input id="temporada" {...register("temporada")} />
        </div>
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <textarea
          id="descripcion"
          rows={3}
          {...register("descripcion")}
          className="w-full rounded-md border border-gc-blanco/15 bg-gc-carbon px-4 py-3 text-sm text-gc-blanco"
        />
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

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("permite_personalizacion")} />
          Permite personalización (nombre y número)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("destacado")} />
          Destacado en home
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("activo")} />
          Publicado (visible en la tienda)
        </label>
      </div>

      {formError && <p className="text-sm text-red-400">{formError}</p>}
      {guardado && <p className="text-sm text-gc-dorado">► Cambios guardados</p>}

      <Button type="submit" isLoading={isSubmitting}>
        Guardar cambios
      </Button>
    </form>
  );
}
