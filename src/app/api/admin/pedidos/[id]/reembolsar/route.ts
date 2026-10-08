import { NextResponse } from "next/server";
import { z } from "zod";
import { PaymentRefund } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";

const bodySchema = z.object({ amount: z.number().positive().optional() });

export async function POST(
  request: Request,
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

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }
  const { amount } = parsed.data;

  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) {
    return NextResponse.json({ error: "pedido_no_encontrado" }, { status: 404 });
  }

  if (order.estado === "reembolsado") {
    return NextResponse.json({ ok: true, yaReembolsado: true });
  }

  // Un pedido ya con un reembolso parcial sigue siendo elegible para reembolsar
  // el resto (total o en otra cuota parcial).
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .in("estado", ["aprobado", "reembolsado_parcial"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!payment?.mp_payment_id) {
    return NextResponse.json({ error: "pago_aprobado_no_encontrado" }, { status: 400 });
  }

  const restante = payment.monto - payment.monto_reembolsado;
  if (amount !== undefined && amount > restante) {
    return NextResponse.json({ error: "monto_supera_lo_pendiente" }, { status: 400 });
  }

  const esTotal = amount === undefined || amount >= restante;

  try {
    const refundClient = new PaymentRefund(getMercadoPagoConfig());
    if (esTotal) {
      await refundClient.total({ payment_id: Number(payment.mp_payment_id) });
    } else {
      await refundClient.create({
        payment_id: Number(payment.mp_payment_id),
        body: { amount },
      });
    }
  } catch (err) {
    console.error("Error solicitando reembolso a Mercado Pago", err);
    return NextResponse.json({ error: "error_pasarela_pago" }, { status: 502 });
  }

  const montoReembolsadoTotal = esTotal ? payment.monto : payment.monto_reembolsado + (amount ?? 0);
  const nuevoEstado = esTotal ? "reembolsado" : "reembolsado_parcial";

  await admin
    .from("payments")
    .update({ estado: nuevoEstado, monto_reembolsado: montoReembolsadoTotal })
    .eq("id", payment.id);
  await admin.from("orders").update({ estado: nuevoEstado }).eq("id", orderId);
  await admin.from("audit_logs").insert({
    admin_id: user.id,
    accion: esTotal ? "reembolso" : "reembolso_parcial",
    entidad: "orders",
    entidad_id: orderId,
    metadata: {
      mp_payment_id: payment.mp_payment_id,
      monto: esTotal ? restante : amount,
      monto_reembolsado_total: montoReembolsadoTotal,
    },
  });

  return NextResponse.json({ ok: true, estado: nuevoEstado });
}
