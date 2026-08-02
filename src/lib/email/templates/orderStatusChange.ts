import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const ESTADO_COPY: Record<string, { titulo: string; mensaje: string }> = {
  en_preparacion: {
    titulo: "Tu pedido está en preparación",
    mensaje: "Ya estamos preparando tu pedido. Te avisamos apenas esté listo.",
  },
  enviado: {
    titulo: "Tu pedido fue enviado",
    mensaje: "Tu pedido salió hacia tu domicilio.",
  },
  entregado: {
    titulo: "Tu pedido fue entregado",
    mensaje: "¡Disfrutalo! Gracias por elegir Ground Control 90.",
  },
  cancelado: {
    titulo: "Tu pedido fue cancelado",
    mensaje: "Si tenés dudas, escribinos por WhatsApp y te ayudamos.",
  },
  reembolsado: {
    titulo: "Tu pedido fue reembolsado",
    mensaje: "El reembolso ya fue procesado en Mercado Pago.",
  },
};

export function orderStatusChangeEmail(order: Order, nuevoEstado: string) {
  const copy = ESTADO_COPY[nuevoEstado];
  if (!copy) return null;

  const html = `
    <div style="background:#000000;padding:32px;font-family:Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;">
        <h1 style="color:#ffffff;font-size:20px;text-transform:uppercase;letter-spacing:0.5px;">
          Ground Control 90
        </h1>
        <p style="color:#c9a227;font-weight:bold;font-size:16px;">► ${copy.titulo}</p>
        <p style="color:#ffffff;font-size:14px;">Pedido ${order.order_number}</p>
        <p style="color:#ffffff;font-size:14px;">${copy.mensaje}</p>
        <p style="color:#6b6b6b;font-size:12px;margin-top:24px;">
          Control en tu movimiento. La base del rendimiento para todos los deportistas.
        </p>
      </div>
    </div>
  `;

  return {
    subject: `${copy.titulo} — Pedido ${order.order_number}`,
    html,
  };
}
