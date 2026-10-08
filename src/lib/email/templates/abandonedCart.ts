import { formatPrice } from "@/lib/utils/format";
import type { CartItem } from "@/lib/cart/store";

export function abandonedCartEmail(items: CartItem[]) {
  const total = items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const recoverUrl = `${siteUrl}/carrito?recuperar=1`;

  const itemsRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;">
            ${item.nombre} — Talle ${item.talle}
          </td>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;text-align:center;">${item.cantidad}</td>
          <td style="padding:8px 0;color:#ffffff;font-size:14px;text-align:right;">${formatPrice(
            item.precioUnitario * item.cantidad
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
        <p style="color:#c9a227;font-weight:bold;font-size:16px;">► Dejaste algo en tu carrito</p>
        <p style="color:#ffffff;font-size:14px;">Todavía te está esperando. Estos son los productos:</p>
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
        <p style="color:#ffffff;font-size:16px;font-weight:bold;margin-top:12px;">Total: ${formatPrice(total)}</p>
        <a href="${recoverUrl}" style="display:inline-block;margin-top:24px;background:#c9a227;color:#000000;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:6px;text-transform:uppercase;font-size:14px;">
          Volver al carrito
        </a>
        <p style="color:#6b6b6b;font-size:12px;margin-top:24px;">
          Control en tu movimiento. La base del rendimiento para todos los deportistas.
        </p>
      </div>
    </div>
  `;

  return {
    subject: "Dejaste productos en tu carrito — Ground Control 90",
    html,
  };
}
