import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAbandonedCartEmail } from "@/lib/email/carts";
import type { CartItem } from "@/lib/cart/store";

const UMBRAL_INACTIVIDAD_MS = 60 * 60 * 1000; // 1 hora

// Vercel Cron invoca esta ruta con GET y agrega automáticamente el header
// `Authorization: Bearer $CRON_SECRET` cuando esa env var está configurada.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const umbral = new Date(Date.now() - UMBRAL_INACTIVIDAD_MS).toISOString();

  const { data: carritos, error } = await admin
    .from("carts")
    .select("user_id, items")
    .lt("updated_at", umbral)
    .is("reminder_sent_at", null);

  if (error) {
    return NextResponse.json({ error: "error_consultando_carritos" }, { status: 500 });
  }

  let enviados = 0;

  for (const carrito of carritos ?? []) {
    const items = carrito.items as unknown as CartItem[];
    if (!Array.isArray(items) || items.length === 0) continue;

    const enviado = await sendAbandonedCartEmail(carrito.user_id, items);
    if (!enviado) continue;

    const { error: updateError } = await admin
      .from("carts")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("user_id", carrito.user_id);
    if (updateError) {
      return NextResponse.json({ error: "error_actualizando_carrito" }, { status: 500 });
    }
    enviados++;
  }

  return NextResponse.json({ recordatorios_enviados: enviados });
}
