import { NextResponse } from "next/server";
import { z } from "zod";
import { cotizarEnvio } from "@/lib/andreani/cotizador";
import { getAppSettings } from "@/lib/settings";
import { checkRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  codigoPostal: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

export async function POST(request: Request) {
  const permitido = await checkRateLimit(request, "cotizar_envio", {
    maxIntentos: 20,
    ventanaSegundos: 60,
  });
  if (!permitido) {
    return NextResponse.json({ error: "demasiados_intentos" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }

  const { codigoPostal, subtotal } = parsed.data;

  const cotizacion = await cotizarEnvio(codigoPostal, subtotal);
  if (cotizacion) {
    return NextResponse.json({ costo: cotizacion.costo, fuente: "andreani" });
  }

  // Andreani no configurado, o la cotización falló: cae al costo plano
  // existente en vez de bloquear el checkout — decisión explícita del roadmap
  // (Phase 7, "Flat-rate fallback").
  const settings = await getAppSettings();
  return NextResponse.json({ costo: settings.costo_envio_domicilio, fuente: "flat" });
}
