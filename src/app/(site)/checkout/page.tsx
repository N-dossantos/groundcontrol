import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import type { Database } from "@/types/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialContacto: { nombre?: string; email?: string; telefono?: string } | undefined;
  let direcciones: Address[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre, apellido, telefono")
      .eq("id", user.id)
      .single();

    initialContacto = {
      nombre: [profile?.nombre, profile?.apellido].filter(Boolean).join(" ") || undefined,
      email: user.email,
      telefono: profile?.telefono ?? undefined,
    };

    const { data: addresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("es_predeterminada", { ascending: false });
    direcciones = addresses ?? [];
  }

  const settings = await getAppSettings();

  return (
    <CheckoutForm
      initialContacto={initialContacto}
      direccionesGuardadas={direcciones ?? []}
      costoEnvioDomicilio={settings.costo_envio_domicilio}
      puntoEncuentroDescripcion={settings.punto_encuentro_descripcion}
    />
  );
}
