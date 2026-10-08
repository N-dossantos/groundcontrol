"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/format";

const ESTADOS_BULK = [
  "pendiente_pago",
  "pagado",
  "en_preparacion",
  "enviado",
  "entregado",
  "cancelado",
  "reembolsado",
] as const;

const ESTADO_LABEL: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  reembolsado_parcial: "Reembolsado parcialmente",
};

type Order = {
  id: string;
  order_number: string;
  estado: string;
  total: number;
  guest_email: string | null;
  user_id: string | null;
  created_at: string;
};

export function PedidosTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [estadoBulk, setEstadoBulk] = useState<(typeof ESTADOS_BULK)[number]>(ESTADOS_BULK[0]);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todosSeleccionados = orders.length > 0 && seleccionados.size === orders.length;

  function toggleTodos(checked: boolean) {
    setSeleccionados(checked ? new Set(orders.map((o) => o.id)) : new Set());
  }

  function toggleUno(id: string, checked: boolean) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function aplicarBulk() {
    setAplicando(true);
    setError(null);

    const ids = [...seleccionados];
    const resultados = await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/pedidos/${id}/estado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: estadoBulk }),
        })
      )
    );

    setAplicando(false);
    if (resultados.some((r) => !r.ok)) {
      setError("Algunos pedidos no se pudieron actualizar.");
    }
    setSeleccionados(new Set());
    router.refresh();
  }

  return (
    <div>
      {seleccionados.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-gc-dorado/40 bg-gc-dorado/10 px-4 py-2">
          <span className="text-sm font-bold">{seleccionados.size} seleccionados</span>
          <select
            value={estadoBulk}
            onChange={(e) => setEstadoBulk(e.target.value as (typeof ESTADOS_BULK)[number])}
            className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-1.5 text-sm text-gc-blanco"
          >
            {ESTADOS_BULK.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABEL[e]}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" isLoading={aplicando} onClick={aplicarBulk}>
            Aplicar estado
          </Button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gc-carbon">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gc-carbon bg-gc-carbon/30 text-xs uppercase text-gc-blanco/60">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={(e) => toggleTodos(e.target.checked)}
                  aria-label="Seleccionar todos"
                />
              </th>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gc-carbon/50 hover:bg-gc-carbon/20">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={seleccionados.has(order.id)}
                    onChange={(e) => toggleUno(order.id, e.target.checked)}
                    aria-label={`Seleccionar pedido ${order.order_number}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${order.id}`} className="font-bold hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gc-blanco/70">
                  {new Date(order.created_at).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-3 text-gc-blanco/70">
                  {order.guest_email ?? (order.user_id ? "Usuario registrado" : "—")}
                </td>
                <td className="px-4 py-3 font-stat">{formatPrice(order.total)}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gc-carbon px-2 py-0.5 text-xs font-bold">
                    {ESTADO_LABEL[order.estado] ?? order.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
