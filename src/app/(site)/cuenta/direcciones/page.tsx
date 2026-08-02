import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AddressesManager } from "@/components/account/AddressesManager";

export const metadata: Metadata = { title: "Mis direcciones" };

export default async function DireccionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user!.id)
    .order("es_predeterminada", { ascending: false });

  return <AddressesManager userId={user!.id} addresses={addresses ?? []} />;
}
