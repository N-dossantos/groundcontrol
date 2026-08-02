import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";
import {
  verifyWebhookSignature,
  InvalidWebhookSignatureError,
} from "@/lib/mercadopago/webhookVerify";
import { sendOrderConfirmationEmail } from "@/lib/email/orders";

function mapMpStatus(status?: string | null): string {
  switch (status) {
    case "approved":
      return "aprobado";
    case "rejected":
      return "rechazado";
    case "cancelled":
      return "cancelado";
    case "in_process":
    case "pending":
      return "en_proceso";
    case "refunded":
      return "reembolsado";
    default:
      return "pendiente";
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id");

  let body: { type?: string; data?: { id?: string } } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  try {
    verifyWebhookSignature({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      console.warn("Webhook de Mercado Pago con firma inválida", err.reason);
      return NextResponse.json({ error: "firma_invalida" }, { status: 401 });
    }
    throw err;
  }

  const type = body?.type ?? url.searchParams.get("type");
  const paymentId = body?.data?.id ?? dataId;

  if (type !== "payment" || !paymentId) {
    // Ignoramos otros tipos de notificación (merchant_order, etc.)
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  try {
    const paymentClient = new Payment(getMercadoPagoConfig());
    const payment = await paymentClient.get({ id: Number(paymentId) });

    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ received: true });

    const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
    if (!order) return NextResponse.json({ received: true });

    const paymentData = {
      order_id: order.id,
      proveedor: "mercado_pago",
      mp_payment_id: String(payment.id),
      mp_preference_id: order.mp_preference_id,
      estado: mapMpStatus(payment.status),
      monto: payment.transaction_amount ?? order.total,
      moneda: payment.currency_id ?? "ARS",
      raw_webhook_payload: JSON.parse(JSON.stringify(payment)),
    };

    // Actualiza el registro `pendiente` creado en el checkout (identificado por
    // order_id, ya que en ese momento todavía no existe mp_payment_id). Si no
    // existe — pedidos de antes de este fix — lo crea.
    const { data: updatedPayment } = await admin
      .from("payments")
      .update(paymentData)
      .eq("order_id", order.id)
      .select("id")
      .maybeSingle();

    if (!updatedPayment) {
      await admin.from("payments").insert(paymentData);
    }

    // Idempotente: solo transicionamos la orden si sigue pendiente_pago, así
    // reintentos del webhook no la vuelven a mover de estado.
    if (order.estado === "pendiente_pago") {
      if (payment.status === "approved") {
        await admin.from("orders").update({ estado: "pagado" }).eq("id", order.id);
        await sendOrderConfirmationEmail({ ...order, estado: "pagado" }).catch((err) =>
          console.error("Error enviando email de confirmación", err)
        );
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        await admin.rpc("release_order_reservation", {
          p_order_id: order.id,
          p_nuevo_estado: "cancelado",
        });
      }
    } else if (payment.status === "refunded" && order.estado !== "reembolsado") {
      // Reembolso disparado desde el panel de Mercado Pago (no desde nuestro
      // admin): el webhook es la única señal de esto, hay que reconciliar.
      await admin.from("orders").update({ estado: "reembolsado" }).eq("id", order.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error procesando webhook de Mercado Pago", err);
    return NextResponse.json({ error: "error_interno" }, { status: 500 });
  }
}
