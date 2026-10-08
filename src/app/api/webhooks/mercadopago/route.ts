import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";
import {
  verifyWebhookSignature,
  InvalidWebhookSignatureError,
} from "@/lib/mercadopago/webhookVerify";
import { sendOrderConfirmationEmail } from "@/lib/email/orders";
import { crearEnvioAndreani } from "@/lib/andreani/envios";

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

  let body: {
    type?: string;
    action?: string;
    live_mode?: boolean;
    user_id?: number | string;
    data?: { id?: string };
  } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  try {
    verifyWebhookSignature({ xSignature, xRequestId, dataId });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      // Diagnóstico de SignatureMismatch (Etapa 3 de docs/PLAN_POR_ETAPAS.md):
      // live_mode dice si la notificación viene del modo pruebas o productivo
      // (cada uno tiene su propio secret), user_id qué cuenta vendedora la
      // generó, y el largo del secret detecta espacios/saltos de línea sin
      // exponer el valor. Sacar una vez resuelto.
      console.warn(
        "Webhook de Mercado Pago con firma inválida",
        err.reason,
        JSON.stringify({
          xSignature,
          xRequestId,
          dataId,
          url: request.url,
          bodyType: body?.type,
          bodyAction: body?.action,
          bodyDataId: body?.data?.id,
          liveMode: body?.live_mode,
          userId: body?.user_id,
          secretLength: process.env.MP_WEBHOOK_SECRET?.trim().length ?? 0,
        })
      );
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

    // MP no cambia `payment.status` en un reembolso parcial (sigue "approved"),
    // así que la única señal de un reembolso parcial disparado desde el panel
    // de MP (no desde nuestro admin) es este campo acumulado.
    const montoReembolsado = payment.transaction_amount_refunded ?? 0;
    const montoPagado = payment.transaction_amount ?? order.total;
    const esReembolsoParcial = payment.status === "approved" && montoReembolsado > 0;

    const paymentData = {
      order_id: order.id,
      proveedor: "mercado_pago",
      mp_payment_id: String(payment.id),
      mp_preference_id: order.mp_preference_id,
      estado: esReembolsoParcial ? "reembolsado_parcial" : mapMpStatus(payment.status),
      monto: montoPagado,
      monto_reembolsado: montoReembolsado,
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

        // Nunca bloquea el critical path: crearEnvioAndreani ya atrapa sus
        // propios errores y devuelve null (Andreani sin configurar, sandbox
        // caído, etc.) — un pedido pagado siempre queda `pagado` sin importar
        // si el envío pudo crearse. `andreani_numero_envio` en null es la
        // señal de "no creado todavía", recuperable por un reintento del
        // webhook (MP reintenta automáticamente) o por el escape hatch manual
        // del admin.
        if (order.metodo_entrega === "envio_domicilio") {
          const envio = await crearEnvioAndreani({ ...order, estado: "pagado" });
          if (envio) {
            await admin
              .from("orders")
              .update({
                andreani_numero_envio: envio.numeroEnvio,
                andreani_envio_creado_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          }
        }
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        await admin.rpc("release_order_reservation", {
          p_order_id: order.id,
          p_nuevo_estado: "cancelado",
        });
      }
    } else if (order.estado !== "reembolsado") {
      // Reembolso (total o parcial) disparado desde el panel de Mercado Pago
      // (no desde nuestro admin): el webhook es la única señal de esto, hay
      // que reconciliar.
      if (payment.status === "refunded") {
        await admin.from("orders").update({ estado: "reembolsado" }).eq("id", order.id);
      } else if (esReembolsoParcial && order.estado !== "reembolsado_parcial") {
        await admin.from("orders").update({ estado: "reembolsado_parcial" }).eq("id", order.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error procesando webhook de Mercado Pago", err);
    return NextResponse.json({ error: "error_interno" }, { status: 500 });
  }
}
