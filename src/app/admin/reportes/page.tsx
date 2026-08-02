import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Admin · Reportes" };

const ESTADOS_VENTA = ["pagado", "en_preparacion", "enviado", "entregado"];

export default async function AdminReportesPage() {
  const supabase = await createClient();

  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, estado, created_at, order_items(product_nombre_snapshot, cantidad, subtotal_item)")
    .in("estado", ESTADOS_VENTA)
    .gte("created_at", hace30Dias.toISOString());

  const ventasTotales = (orders ?? []).reduce((sum, o) => sum + o.total, 0);
  const cantidadPedidos = orders?.length ?? 0;
  const ticketPromedio = cantidadPedidos > 0 ? ventasTotales / cantidadPedidos : 0;

  const ventasPorProducto = new Map<string, { cantidad: number; total: number }>();
  for (const order of orders ?? []) {
    for (const item of order.order_items) {
      const actual = ventasPorProducto.get(item.product_nombre_snapshot) ?? { cantidad: 0, total: 0 };
      actual.cantidad += item.cantidad;
      actual.total += item.subtotal_item;
      ventasPorProducto.set(item.product_nombre_snapshot, actual);
    }
  }

  const topProductos = Array.from(ventasPorProducto.entries())
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 10);

  return (
    <div>
      <h1 className="mb-6 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Reportes (últimos 30 días)
      </h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">Ventas</p>
          <p className="mt-1 font-stat text-3xl font-bold text-gc-dorado">
            {formatPrice(ventasTotales)}
          </p>
        </div>
        <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">Pedidos</p>
          <p className="mt-1 font-stat text-3xl font-bold">{cantidadPedidos}</p>
        </div>
        <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
            Ticket promedio
          </p>
          <p className="mt-1 font-stat text-3xl font-bold">{formatPrice(ticketPromedio)}</p>
        </div>
      </div>

      <h2 className="mb-3 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco/60">
        Productos más vendidos
      </h2>
      <div className="max-w-lg overflow-hidden rounded-lg border border-gc-carbon">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gc-carbon bg-gc-carbon/30 text-xs uppercase text-gc-blanco/60">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Unidades</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map(([nombre, data]) => (
              <tr key={nombre} className="border-b border-gc-carbon/50">
                <td className="px-4 py-3">{nombre}</td>
                <td className="px-4 py-3 font-stat">{data.cantidad}</td>
                <td className="px-4 py-3 font-stat">{formatPrice(data.total)}</td>
              </tr>
            ))}
            {topProductos.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gc-blanco/50">
                  Todavía no hay ventas en este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
