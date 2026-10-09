import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export function buildPreferenceBody({
  order,
  items,
  contactoEmail,
  contactoNombre,
  contactoTelefono,
  siteUrl,
  cuotasMaximas,
}: {
  order: Order;
  items: OrderItem[];
  contactoEmail: string;
  contactoNombre: string;
  contactoTelefono: string;
  siteUrl: string;
  cuotasMaximas: number;
}): PreferenceRequest {
  const productItems = items.map((item) => ({
    id: item.product_variant_id,
    title: [item.product_nombre_snapshot, `Talle ${item.talle_snapshot}`]
      .filter(Boolean)
      .join(" - "),
    description:
      [item.nombre_estampado, item.numero_estampado].filter(Boolean).join(" #") || undefined,
    quantity: item.cantidad,
    currency_id: "ARS",
    unit_price: item.precio_unitario,
  }));

  const envioItem =
    order.costo_envio > 0
      ? [
          {
            id: "envio",
            title: "Envío a domicilio",
            quantity: 1,
            currency_id: "ARS",
            unit_price: order.costo_envio,
          },
        ]
      : [];

  // Mercado Pago cobra la suma de los ítems de la preferencia. Cuando hay un
  // cupón, los precios originales de order_items ya no representan el total
  // reservado; agrupamos los productos al importe final con descuento.
  const productosConDescuento =
    order.descuento > 0
      ? order.subtotal > order.descuento
        ? [{
            id: order.id,
            title: `Productos del pedido ${order.order_number}`,
            description: items.map((item) => `${item.cantidad} × ${item.product_nombre_snapshot}`).join(", ").slice(0, 255),
            quantity: 1,
            currency_id: "ARS",
            unit_price: Math.round((order.subtotal - order.descuento) * 100) / 100,
          }]
        : []
      : productItems;

  if (order.total <= 0 || productosConDescuento.length + envioItem.length === 0) {
    throw new Error(`El pedido ${order.order_number} no tiene un importe cobrable`);
  }

  const totalPreferencia = [...productosConDescuento, ...envioItem].reduce(
    (centavos, item) => centavos + Math.round(item.unit_price * 100) * item.quantity,
    0
  );
  if (totalPreferencia !== Math.round(order.total * 100)) {
    throw new Error(`El importe del pedido ${order.order_number} no coincide con la preferencia`);
  }

  return {
    items: [...productosConDescuento, ...envioItem],
    payer: {
      email: contactoEmail,
      name: contactoNombre,
      phone: { number: contactoTelefono },
    },
    external_reference: order.id,
    notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    back_urls: {
      success: `${siteUrl}/checkout/exito?order=${order.order_number}&token=${order.confirmation_token}`,
      pending: `${siteUrl}/checkout/pendiente?order=${order.order_number}&token=${order.confirmation_token}`,
      failure: `${siteUrl}/checkout/error?order=${order.order_number}&token=${order.confirmation_token}`,
    },
    auto_return: "approved",
    statement_descriptor: "GROUNDCONTROL90",
    payment_methods: { installments: cuotasMaximas },
  };
}
