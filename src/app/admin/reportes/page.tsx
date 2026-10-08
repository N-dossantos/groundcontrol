import type { Metadata } from "next";
import { endOfDay, format, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Admin · Reportes" };

const ESTADOS_VENTA = ["pagado", "en_preparacion", "enviado", "entregado"];
const FECHA_FORMATO = "yyyy-MM-dd";

type ProductoAcumulado = {
  cantidad: number;
  total: number;
  costoTotal: number;
  costoDesconocido: boolean;
};

function formatMargen(margen: number, costoDesconocido: boolean) {
  if (costoDesconocido) return "—";
  return formatPrice(margen);
}

export default async function AdminReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde: desdeParam, hasta: hastaParam } = await searchParams;

  const hoy = new Date();
  const desdeStr = desdeParam || format(subDays(hoy, 30), FECHA_FORMATO);
  const hastaStr = hastaParam || format(hoy, FECHA_FORMATO);

  const desdeDate = new Date(`${desdeStr}T00:00:00`);
  const hastaDate = endOfDay(new Date(`${hastaStr}T00:00:00`));

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, total, estado, created_at, order_items(product_nombre_snapshot, cantidad, subtotal_item, order_item_costos(costo_unitario))"
    )
    .in("estado", ESTADOS_VENTA)
    .gte("created_at", desdeDate.toISOString())
    .lte("created_at", hastaDate.toISOString());

  const ventasTotales = (orders ?? []).reduce((sum, o) => sum + o.total, 0);
  const cantidadPedidos = orders?.length ?? 0;
  const ticketPromedio = cantidadPedidos > 0 ? ventasTotales / cantidadPedidos : 0;

  const ventasPorProducto = new Map<string, ProductoAcumulado>();
  let costoTotalGeneral = 0;
  let costoDesconocidoGeneral = false;

  for (const order of orders ?? []) {
    for (const item of order.order_items) {
      const actual = ventasPorProducto.get(item.product_nombre_snapshot) ?? {
        cantidad: 0,
        total: 0,
        costoTotal: 0,
        costoDesconocido: false,
      };
      actual.cantidad += item.cantidad;
      actual.total += item.subtotal_item;

      const costoUnitario = item.order_item_costos?.costo_unitario;
      if (costoUnitario == null) {
        actual.costoDesconocido = true;
        costoDesconocidoGeneral = true;
      } else {
        actual.costoTotal += costoUnitario * item.cantidad;
        costoTotalGeneral += costoUnitario * item.cantidad;
      }

      ventasPorProducto.set(item.product_nombre_snapshot, actual);
    }
  }

  const margenTotal = ventasTotales - costoTotalGeneral;

  const topProductos = Array.from(ventasPorProducto.entries())
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 10);

  return (
    <div>
      <h1 className="mb-6 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Reportes
      </h1>

      <form className="mb-6 flex flex-wrap items-end gap-3" method="get">
        <div>
          <label
            htmlFor="desde"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gc-blanco/70"
          >
            Desde
          </label>
          <input
            id="desde"
            type="date"
            name="desde"
            defaultValue={desdeStr}
            className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
          />
        </div>
        <div>
          <label
            htmlFor="hasta"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gc-blanco/70"
          >
            Hasta
          </label>
          <input
            id="hasta"
            type="date"
            name="hasta"
            defaultValue={hastaStr}
            className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-gc-blanco/15 px-4 py-2 text-sm font-bold uppercase hover:border-gc-blanco"
        >
          Filtrar
        </button>
      </form>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">Margen</p>
          <p className="mt-1 font-stat text-3xl font-bold">
            {formatMargen(margenTotal, costoDesconocidoGeneral)}
          </p>
        </div>
      </div>

      <h2 className="mb-3 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco/60">
        Productos más vendidos
      </h2>
      <div className="max-w-2xl overflow-hidden rounded-lg border border-gc-carbon">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gc-carbon bg-gc-carbon/30 text-xs uppercase text-gc-blanco/60">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Unidades</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Margen</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map(([nombre, data]) => (
              <tr key={nombre} className="border-b border-gc-carbon/50">
                <td className="px-4 py-3">{nombre}</td>
                <td className="px-4 py-3 font-stat">{data.cantidad}</td>
                <td className="px-4 py-3 font-stat">{formatPrice(data.total)}</td>
                <td className="px-4 py-3 font-stat">
                  {formatMargen(data.total - data.costoTotal, data.costoDesconocido)}
                </td>
              </tr>
            ))}
            {topProductos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gc-blanco/50">
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
