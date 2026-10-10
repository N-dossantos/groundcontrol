"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { safeAuthRedirect } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { AuthCard } from "@/components/ui/AuthCard";
import { Alert } from "@/components/ui/Alert";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAuthRedirect(searchParams.get("next"));
  const [formError, setFormError] = useState<string | null>(
    searchParams.get("error") === "oauth" ? "No pudimos iniciar sesión con Google. Intentá de nuevo." : null
  );
  const [oauthLoading, setOauthLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      setFormError("Email o contraseña incorrectos.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    setOauthLoading(true);
    setFormError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) setFormError("No pudimos iniciar sesión con Google. Intentá de nuevo.");
    } catch {
      setFormError("No pudimos iniciar sesión con Google. Intentá de nuevo.");
    } finally {
      setOauthLoading(false);
    }
  }

  return (
    <AuthCard title="Iniciar sesión">
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
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Ingresar
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
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-gc-dorado hover:underline">
          Registrate
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-gc-blanco/60">
        <Link href="/recuperar-password" className="hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </AuthCard>
  );
}
