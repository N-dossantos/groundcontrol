import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Mis pedidos" };

const ESTADO_LABEL: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

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
    return <p className="text-sm text-gc-blanco/60">Todavía no hiciste ningún pedido.</p>;
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
            <p className="text-xs text-gc-blanco/60">
              {new Date(order.created_at).toLocaleDateString("es-AR")} ·{" "}
              {ESTADO_LABEL[order.estado] ?? order.estado}
            </p>
          </div>
          <p className="font-stat font-bold">{formatPrice(order.total)}</p>
        </Link>
      ))}
    </div>
  );
}
