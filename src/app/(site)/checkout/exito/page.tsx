import type { Metadata } from "next";
import { CheckoutResultPage } from "@/components/checkout/CheckoutResultPage";

export const metadata: Metadata = { title: "Pedido confirmado" };

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order, token } = await searchParams;

  return (
    <CheckoutResultPage
      orderNumber={order}
      token={token}
      titulo="¡Pedido confirmado!"
      mensaje="Te enviamos un email con el detalle de tu compra. ¡Gracias por elegir Ground Control 90!"
      acento="dorado"
    />
  );
}
