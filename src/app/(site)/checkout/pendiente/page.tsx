import type { Metadata } from "next";
import { CheckoutResultPage } from "@/components/checkout/CheckoutResultPage";

export const metadata: Metadata = { title: "Pago pendiente" };

export default async function PendientePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order, token } = await searchParams;

  return (
    <CheckoutResultPage
      orderNumber={order}
      token={token}
      titulo="Tu pago está pendiente"
      mensaje="Mercado Pago está procesando tu pago. Te avisamos por email apenas se confirme."
      acento="blanco"
    />
  );
}
