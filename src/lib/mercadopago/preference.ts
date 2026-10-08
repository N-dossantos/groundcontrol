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

  return {
    items: [...productItems, ...envioItem],
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
