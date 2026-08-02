"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { perfilSchema, type PerfilInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

export function PerfilForm({
  userId,
  email,
  initial,
}: {
  userId: string;
  email: string;
  initial: PerfilInput;
}) {
  const [guardado, setGuardado] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PerfilInput>({ resolver: zodResolver(perfilSchema), defaultValues: initial });

  async function onSubmit(data: PerfilInput) {
    setFormError(null);
    setGuardado(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ nombre: data.nombre, apellido: data.apellido, telefono: data.telefono })
      .eq("id", userId);

    if (error) {
      setFormError("No pudimos guardar los cambios. Intentá de nuevo.");
      return;
    }
    setGuardado(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" error={errors.nombre?.message} {...register("nombre")} />
        <FieldError message={errors.nombre?.message} />
      </div>
      <div>
        <Label htmlFor="apellido">Apellido</Label>
        <Input id="apellido" {...register("apellido")} />
      </div>
      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...register("telefono")} />
      </div>
      {formError && <p className="text-sm text-red-400">{formError}</p>}
      {guardado && <p className="text-sm text-gc-dorado">► Cambios guardados</p>}
      <Button type="submit" isLoading={isSubmitting}>
        Guardar cambios
      </Button>
    </form>
  );
}
