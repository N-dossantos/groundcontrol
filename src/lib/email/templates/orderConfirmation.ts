import { formatPrice } from "@/lib/utils/format";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

const METODO_ENTREGA_LABEL: Record<string, string> = {
  retiro_punto_encuentro: "Retiro en punto de encuentro (Canning, Buenos Aires)",
  envio_domicilio: "Envío a domicilio",
};

export function orderConfirmationEmail(order: Order, items: OrderItem[]) {
  const itemsRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;">
            ${item.product_nombre_snapshot} — Talle ${item.talle_snapshot}
            ${
              item.nombre_estampado || item.numero_estampado
                ? `<br/><span style="color:#9a9a9a;font-size:12px;">${[
                    item.nombre_estampado,
                    item.numero_estampado,
                  ]
                    .filter(Boolean)
                    .join(" · ")}</span>`
                : ""
            }
          </td>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;text-align:center;">${item.cantidad}</td>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;text-align:right;">${formatPrice(
            item.subtotal_item
          )}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="background:#000000;padding:32px;font-family:Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;">
        <h1 style="color:#ffffff;font-size:20px;text-transform:uppercase;letter-spacing:0.5px;">
          Ground Control 90
        </h1>
        <p style="color:#c9a227;font-weight:bold;font-size:16px;">
          ¡Pedido confirmado! ► ${order.order_number}
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left;color:#9a9a9a;font-size:12px;border-bottom:1px solid #1a1a1a;padding-bottom:8px;">Producto</th>
              <th style="text-align:center;color:#9a9a9a;font-size:12px;border-bottom:1px solid #1a1a1a;padding-bottom:8px;">Cant.</th>
              <th style="text-align:right;color:#9a9a9a;font-size:12px;border-bottom:1px solid #1a1a1a;padding-bottom:8px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div style="border-top:1px solid #1a1a1a;margin-top:12px;padding-top:12px;">
          <p style="color:#ffffff;font-size:14px;margin:4px 0;">Subtotal: ${formatPrice(order.subtotal)}</p>
          ${
            order.costo_envio > 0
              ? `<p style="color:#ffffff;font-size:14px;margin:4px 0;">Envío: ${formatPrice(order.costo_envio)}</p>`
              : ""
          }
          ${
            order.descuento > 0
              ? `<p style="color:#ffffff;font-size:14px;margin:4px 0;">Descuento: -${formatPrice(order.descuento)}</p>`
              : ""
          }
          <p style="color:#ffffff;font-size:16px;font-weight:bold;margin:8px 0;">Total: ${formatPrice(order.total)}</p>
        </div>
        <p style="color:#ffffff;font-size:14px;margin-top:16px;">
          Modalidad de entrega: ${METODO_ENTREGA_LABEL[order.metodo_entrega] ?? order.metodo_entrega}
        </p>
        <p style="color:#6b6b6b;font-size:12px;margin-top:24px;">
          Control en tu movimiento. La base del rendimiento para todos los deportistas.
        </p>
      </div>
    </div>
  `;

  return {
    subject: `Pedido confirmado ${order.order_number} — Ground Control 90`,
    html,
  };
}
