"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  recuperarPasswordSchema,
  type RecuperarPasswordInput,
} from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { AuthCard } from "@/components/ui/AuthCard";

export function RecuperarPasswordForm() {
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarPasswordInput>({ resolver: zodResolver(recuperarPasswordSchema) });

  async function onSubmit(data: RecuperarPasswordInput) {
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/actualizar-password`,
    });
    // Siempre mostramos el mismo mensaje exista o no la cuenta, para no filtrar
    // qué emails están registrados.
    setEnviado(true);
  }

  if (enviado) {
    return (
      <AuthCard title="Revisá tu email">
        <p className="text-center text-sm text-gc-blanco/70">
          Si el email que ingresaste está registrado, te enviamos un link para
          restablecer tu contraseña.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Recuperar contraseña">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Enviar link de recuperación
        </Button>
      </form>
    </AuthCard>
  );
}
