import Link from "next/link";
import { getOrderByConfirmationToken } from "@/lib/orders";
import { getAppSettings } from "@/lib/settings";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Button } from "@/components/ui/Button";

export async function CheckoutResultPage({
  orderNumber,
  token,
  titulo,
  mensaje,
  acento,
}: {
  orderNumber?: string;
  token?: string;
  titulo: string;
  mensaje: string;
  acento: "dorado" | "blanco";
}) {
  const order = orderNumber && token ? await getOrderByConfirmationToken(orderNumber, token) : null;
  const settings = await getAppSettings();
  const noEncontrado = !order;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {noEncontrado ? (
        <>
          <h1 className="font-headline text-2xl font-extrabold uppercase tracking-wide text-gc-blanco">
            No pudimos encontrar tu pedido
          </h1>
          <p className="mt-2 text-sm text-gc-blanco/70">
            El enlace puede haber expirado o ser inválido. Si ya hiciste tu compra, escribinos y
            te confirmamos el estado de tu pedido.
          </p>
        </>
      ) : (
        <>
          <h1
            className={`font-headline text-2xl font-extrabold uppercase tracking-wide ${
              acento === "dorado" ? "text-gc-dorado" : "text-gc-blanco"
            }`}
          >
            {titulo}
          </h1>
          <p className="mt-2 text-sm text-gc-blanco/70">{mensaje}</p>
        </>
      )}

      {order && (
        <div className="mt-8">
          <OrderSummaryCard order={order} />
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href="/catalogo">
          <Button variant="secondary">Seguir comprando</Button>
        </Link>
        <WhatsAppButton
          numero={settings.whatsapp_numero}
          mensaje={
            orderNumber
              ? `Hola! Tengo una consulta sobre mi pedido ${orderNumber}.`
              : "Hola! Tengo una consulta sobre mi compra."
          }
          className="text-sm font-bold text-gc-dorado hover:underline"
        >
          ► Escribinos por WhatsApp
        </WhatsAppButton>
      </div>
    </div>
  );
}
