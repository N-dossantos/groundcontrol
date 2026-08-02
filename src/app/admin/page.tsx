import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Admin · Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [pendientes, ventasDelMes, stockBajo] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("estado", "pendiente_pago"),
    supabase
      .from("orders")
      .select("total")
      .eq("estado", "pagado")
      .gte("created_at", inicioMes.toISOString()),
    supabase
      .from("product_variants")
      .select("id, sku, stock, stock_minimo")
      .gt("stock", 0)
      .order("stock", { ascending: true })
      .limit(50),
  ]);

  const totalVentasMes = (ventasDelMes.data ?? []).reduce((sum, o) => sum + o.total, 0);
  const bajoStock = (stockBajo.data ?? []).filter((v) => v.stock <= v.stock_minimo);

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-2xl font-extrabold uppercase tracking-wide">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
            Pedidos pendientes
          </p>
          <p className="mt-1 font-stat text-3xl font-bold">{pendientes.count ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
            Ventas del mes
          </p>
          <p className="mt-1 font-stat text-3xl font-bold text-gc-dorado">
            {formatPrice(totalVentasMes)}
          </p>
        </div>
        <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gc-blanco/50">
            Variantes con stock bajo
          </p>
          <p className="mt-1 font-stat text-3xl font-bold">{bajoStock.length}</p>
        </div>
      </div>

      {bajoStock.length > 0 && (
        <div>
          <h2 className="mb-3 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-dorado">
            ► Stock bajo
          </h2>
          <ul className="space-y-1 text-sm">
            {bajoStock.map((v) => (
              <li key={v.id} className="flex justify-between rounded bg-gc-carbon/20 px-3 py-2">
                <span>{v.sku}</span>
                <span className="font-stat font-bold">{v.stock} un.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
