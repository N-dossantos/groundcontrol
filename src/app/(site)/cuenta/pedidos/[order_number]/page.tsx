import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";
import { orderStatusLabel, orderStatusBadgeVariant } from "@/lib/utils/orderStatus";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Detalle de pedido" };

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
      <Badge variant={orderStatusBadgeVariant(order.estado)} className="mb-4">
        {orderStatusLabel(order.estado)}
      </Badge>
      <OrderSummaryCard order={order} />
    </div>
  );
}
