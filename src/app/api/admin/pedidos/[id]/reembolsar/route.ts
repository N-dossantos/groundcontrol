import { NextResponse } from "next/server";
import { PaymentRefund } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await context.params;

  // El caller debe ser un admin autenticado — se verifica con el cliente de
  // sesión (RLS) antes de tocar nada con el cliente de service_role.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no_autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "no_autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) {
    return NextResponse.json({ error: "pedido_no_encontrado" }, { status: 404 });
  }

  if (order.estado === "reembolsado") {
    return NextResponse.json({ ok: true, yaReembolsado: true });
  }

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .eq("estado", "aprobado")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!payment?.mp_payment_id) {
    return NextResponse.json({ error: "pago_aprobado_no_encontrado" }, { status: 400 });
  }

  try {
    const refundClient = new PaymentRefund(getMercadoPagoConfig());
    await refundClient.total({ payment_id: Number(payment.mp_payment_id) });
  } catch (err) {
    console.error("Error solicitando reembolso a Mercado Pago", err);
    return NextResponse.json({ error: "error_pasarela_pago" }, { status: 502 });
  }

  await admin.from("payments").update({ estado: "reembolsado" }).eq("id", payment.id);
  await admin.from("orders").update({ estado: "reembolsado" }).eq("id", orderId);
  await admin.from("audit_logs").insert({
    admin_id: user.id,
    accion: "reembolso",
    entidad: "orders",
    entidad_id: orderId,
    metadata: { mp_payment_id: payment.mp_payment_id },
  });

  return NextResponse.json({ ok: true });
}
