"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registroSchema, type RegistroInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { AuthCard } from "@/components/ui/AuthCard";
import { Alert } from "@/components/ui/Alert";

export function RegistroForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [revisarEmail, setRevisarEmail] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistroInput>({ resolver: zodResolver(registroSchema) });

  async function onSubmit(data: RegistroInput) {
    setFormError(null);
    const supabase = createClient();
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.nombre } },
    });

    if (error) {
      setFormError(
        error.message.includes("already registered")
          ? "Ese email ya está registrado."
          : "No pudimos crear tu cuenta. Intentá de nuevo."
      );
      return;
    }

    if (!signUpData.session) {
      setRevisarEmail(true);
      return;
    }

    router.push("/cuenta");
    router.refresh();
  }

  async function handleGoogle() {
    setOauthLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/cuenta` },
    });
  }

  if (revisarEmail) {
    return (
      <AuthCard title="Confirmá tu cuenta">
        <p className="text-center text-sm text-gc-blanco/70">
          Te enviamos un email para confirmar tu cuenta. Revisá tu bandeja de
          entrada (y spam) para activarla.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Crear cuenta">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" autoComplete="name" error={errors.nombre?.message} {...register("nombre")} />
          <FieldError message={errors.nombre?.message} />
        </div>
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
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Crear cuenta
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gc-blanco/10" />
        <span className="text-xs uppercase text-gc-blanco/40">o</span>
        <div className="h-px flex-1 bg-gc-blanco/10" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleGoogle}
        isLoading={oauthLoading}
      >
        Continuar con Google
      </Button>

      <p className="mt-6 text-center text-sm text-gc-blanco/60">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-gc-dorado hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </AuthCard>
  );
}
