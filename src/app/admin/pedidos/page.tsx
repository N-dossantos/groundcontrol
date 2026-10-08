import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/product/Pagination";
import { PedidosTable } from "@/components/admin/PedidosTable";

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

  const exportParams = new URLSearchParams();
  if (estado) exportParams.set("estado", estado);
  if (q) exportParams.set("q", q);
  const exportHref = `/api/admin/pedidos/export${exportParams.size ? `?${exportParams}` : ""}`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-headline text-2xl font-extrabold uppercase tracking-wide">
          Pedidos
        </h1>
        <a
          href={exportHref}
          className="rounded-md border border-gc-blanco/15 px-4 py-2 text-sm font-bold uppercase hover:border-gc-blanco"
        >
          Exportar CSV
        </a>
      </div>

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

      <PedidosTable orders={orders ?? []} />

      <Pagination
        page={page}
        totalPages={totalPages}
        searchParams={{ estado, q, page: pageParam }}
      />
    </div>
  );
}
