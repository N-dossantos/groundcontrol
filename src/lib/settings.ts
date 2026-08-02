import { createPublicClient } from "@/lib/supabase/public";

export type AppSettings = {
  costo_envio_domicilio: number;
  whatsapp_numero: string;
  punto_encuentro_direccion: string;
  punto_encuentro_descripcion: string;
};

const DEFAULTS: AppSettings = {
  costo_envio_domicilio: 0,
  whatsapp_numero: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491100000000",
  punto_encuentro_direccion: "Canning, Buenos Aires",
  punto_encuentro_descripcion: "Retiro coordinado por WhatsApp en Canning, Buenos Aires",
};

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("app_settings").select("key, value");

  if (error || !data) return DEFAULTS;

  const map = Object.fromEntries(data.map((row) => [row.key, row.value]));

  return {
    costo_envio_domicilio:
      typeof map.costo_envio_domicilio === "number"
        ? map.costo_envio_domicilio
        : DEFAULTS.costo_envio_domicilio,
    whatsapp_numero:
      typeof map.whatsapp_numero === "string" ? map.whatsapp_numero : DEFAULTS.whatsapp_numero,
    punto_encuentro_direccion:
      typeof map.punto_encuentro_direccion === "string"
        ? map.punto_encuentro_direccion
        : DEFAULTS.punto_encuentro_direccion,
    punto_encuentro_descripcion:
      typeof map.punto_encuentro_descripcion === "string"
        ? map.punto_encuentro_descripcion
        : DEFAULTS.punto_encuentro_descripcion,
  };
}
