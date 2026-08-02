import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";

export const metadata: Metadata = { title: "Detalle de pedido" };

const ESTADO_LABEL: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ order_number: string }>;
}) {
  const { order_number } = await params;
  const supabase = await createClient();

  // RLS (orders_select_own) ya garantiza que solo se puede leer el propio pedido.
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", order_number)
    .single();

  if (!order) notFound();

  return (
    <div>
      <p className="mb-4 text-sm font-bold uppercase tracking-wide text-gc-dorado">
        {ESTADO_LABEL[order.estado] ?? order.estado}
      </p>
      <OrderSummaryCard order={order} />
    </div>
  );
}
