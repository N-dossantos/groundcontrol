import { formatPrice } from "@/lib/utils/format";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: Database["public"]["Tables"]["order_items"]["Row"][];
};

const METODO_ENTREGA_LABEL: Record<string, string> = {
  retiro_punto_encuentro: "Retiro en punto de encuentro",
  envio_domicilio: "Envío a domicilio",
};

export function OrderSummaryCard({ order }: { order: Order }) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-gc-carbon bg-gc-carbon/20 p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
        Pedido {order.order_number}
      </p>

      <ul className="mt-4 space-y-2 border-t border-gc-carbon pt-4 text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span className="text-gc-blanco/70">
              {item.product_nombre_snapshot} · Talle {item.talle_snapshot} × {item.cantidad}
            </span>
            <span className="shrink-0 font-stat font-bold">
              {formatPrice(item.subtotal_item)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 border-t border-gc-carbon pt-4 text-sm">
        <div className="flex justify-between text-gc-blanco/70">
          <span>Entrega</span>
          <span>{METODO_ENTREGA_LABEL[order.metodo_entrega] ?? order.metodo_entrega}</span>
        </div>
        <div className="flex justify-between pt-1 font-stat text-lg font-bold text-gc-blanco">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
