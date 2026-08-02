import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PerfilForm } from "@/components/account/PerfilForm";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, apellido, telefono")
    .eq("id", user!.id)
    .single();

  return (
    <PerfilForm
      userId={user!.id}
      email={user!.email ?? ""}
      initial={{
        nombre: profile?.nombre ?? "",
        apellido: profile?.apellido ?? "",
        telefono: profile?.telefono ?? "",
      }}
    />
  );
}
