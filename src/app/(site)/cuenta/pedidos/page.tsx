import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";
import { orderStatusLabel, orderStatusBadgeVariant } from "@/lib/utils/orderStatus";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, estado, total, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="Sin pedidos todavía"
        description="Cuando hagas tu primera compra, la vas a poder seguir acá."
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-3">
      {orders.map((order) => (
        <Link
          key={order.order_number}
          href={`/cuenta/pedidos/${order.order_number}`}
          className="flex items-center justify-between rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4 hover:border-gc-blanco/30"
        >
          <div>
            <p className="font-bold">{order.order_number}</p>
            <p className="mt-1 text-xs text-gc-blanco/60">
              {new Date(order.created_at).toLocaleDateString("es-AR")}
            </p>
            <Badge variant={orderStatusBadgeVariant(order.estado)} className="mt-1.5">
              {orderStatusLabel(order.estado)}
            </Badge>
          </div>
          <p className="font-stat font-bold">{formatPrice(order.total)}</p>
        </Link>
      ))}
    </div>
  );
}
