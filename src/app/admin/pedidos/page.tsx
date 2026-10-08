import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";
import { Pagination } from "@/components/product/Pagination";

export const metadata: Metadata = { title: "Admin · Pedidos" };

const PAGE_SIZE = 50;

const ESTADOS = [
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
};

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string; page?: string }>;
}) {
  const { estado, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, estado, total, guest_email, user_id, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (estado) query = query.eq("estado", estado);
  if (q) query = query.ilike("order_number", `%${q}%`);

  const { data: orders, count } = await query.range(from, to);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-6 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Pedidos
      </h1>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <select
          name="estado"
          defaultValue={estado ?? ""}
          className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_LABEL[e]}
            </option>
          ))}
        </select>
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por número de pedido"
          className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
        />
        <button
          type="submit"
          className="rounded-md border border-gc-blanco/15 px-4 py-2 text-sm font-bold uppercase hover:border-gc-blanco"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-gc-carbon">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gc-carbon bg-gc-carbon/30 text-xs uppercase text-gc-blanco/60">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="border-b border-gc-carbon/50 hover:bg-gc-carbon/20">
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

      <Pagination
        page={page}
        totalPages={totalPages}
        searchParams={{ estado, q, page: pageParam }}
      />
    </div>
  );
}
