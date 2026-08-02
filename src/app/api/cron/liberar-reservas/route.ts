import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel Cron invoca esta ruta con GET y agrega automáticamente el header
// `Authorization: Bearer $CRON_SECRET` cuando esa env var está configurada.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: vencidas, error } = await admin
    .from("orders")
    .select("id")
    .eq("estado", "pendiente_pago")
    .lt("reserva_expira_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: "error_consultando_ordenes" }, { status: 500 });
  }

  for (const { id } of vencidas ?? []) {
    await admin.rpc("release_order_reservation", { p_order_id: id, p_nuevo_estado: "cancelado" });
  }

  return NextResponse.json({ liberadas: vencidas?.length ?? 0 });
}
