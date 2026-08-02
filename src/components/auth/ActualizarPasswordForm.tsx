"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  actualizarPasswordSchema,
  type ActualizarPasswordInput,
} from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { AuthCard } from "@/components/ui/AuthCard";

export function ActualizarPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActualizarPasswordInput>({ resolver: zodResolver(actualizarPasswordSchema) });

  async function onSubmit(data: ActualizarPasswordInput) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      setFormError("No pudimos actualizar tu contraseña. Pedí un nuevo link de recuperación.");
      return;
    }

    router.push("/cuenta/perfil");
    router.refresh();
  }

  return (
    <AuthCard title="Actualizar contraseña">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirmarPassword">Confirmar contraseña</Label>
          <Input
            id="confirmarPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmarPassword?.message}
            {...register("confirmarPassword")}
          />
          <FieldError message={errors.confirmarPassword?.message} />
        </div>
        {formError && <p className="text-sm text-red-400">{formError}</p>}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Guardar contraseña
        </Button>
      </form>
    </AuthCard>
  );
}
