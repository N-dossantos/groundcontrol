import type { Metadata } from "next";
import { CheckoutResultPage } from "@/components/checkout/CheckoutResultPage";

export const metadata: Metadata = { title: "Pago rechazado" };

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order, token } = await searchParams;

  return (
    <CheckoutResultPage
      orderNumber={order}
      token={token}
      titulo="No pudimos procesar tu pago"
      mensaje="Tu pago fue rechazado. Podés reintentar el pago o escribirnos si necesitás ayuda."
      acento="blanco"
    />
  );
}
