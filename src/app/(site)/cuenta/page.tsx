import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-4">
      <p className="text-gc-blanco/80">
        Hola{profile?.nombre ? `, ${profile.nombre}` : ""} ►
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/cuenta/pedidos"
          className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4 text-sm font-bold uppercase tracking-wide hover:border-gc-blanco/30"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/cuenta/direcciones"
          className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4 text-sm font-bold uppercase tracking-wide hover:border-gc-blanco/30"
        >
          Mis direcciones
        </Link>
        <Link
          href="/cuenta/perfil"
          className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4 text-sm font-bold uppercase tracking-wide hover:border-gc-blanco/30"
        >
          Editar perfil
        </Link>
      </div>
    </div>
  );
}
