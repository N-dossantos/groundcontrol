import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Admin · Configuración" };

export default async function AdminConfiguracionPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");

  const map = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));

  return (
    <div>
      <h1 className="mb-6 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Configuración
      </h1>
      <SettingsForm
        initial={{
          costoEnvioDomicilio: typeof map.costo_envio_domicilio === "number" ? map.costo_envio_domicilio : 0,
          whatsappNumero: typeof map.whatsapp_numero === "string" ? map.whatsapp_numero : "",
          puntoEncuentroDireccion:
            typeof map.punto_encuentro_direccion === "string" ? map.punto_encuentro_direccion : "",
          puntoEncuentroDescripcion:
            typeof map.punto_encuentro_descripcion === "string" ? map.punto_encuentro_descripcion : "",
          cuotasMaximas: typeof map.cuotas_maximas === "number" ? map.cuotas_maximas : 12,
        }}
      />
    </div>
  );
}
