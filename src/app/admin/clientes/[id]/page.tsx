import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";
import { PromoteButton } from "@/components/admin/PromoteButton";

export const metadata: Metadata = { title: "Admin · Detalle de cliente" };

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

export default async function AdminClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: cliente } = await supabase
    .from("profiles")
    .select("id, nombre, apellido, telefono, role, created_at")
    .eq("id", id)
    .single();

  if (!cliente) notFound();

  const { data: pedidos } = await supabase
    .from("orders")
    .select("id, order_number, estado, total, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Link
        href="/admin/clientes"
        className="mb-4 inline-block text-xs font-bold uppercase tracking-wide text-gc-blanco/60 hover:text-gc-blanco"
      >
        ← Clientes
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-extrabold uppercase tracking-wide">
            {[cliente.nombre, cliente.apellido].filter(Boolean).join(" ") || "Cliente sin nombre"}
          </h1>
          <p className="mt-1 text-sm text-gc-blanco/70">{cliente.telefono ?? "Sin teléfono"}</p>
          <p className="text-sm text-gc-blanco/50">
            Registrado el {new Date(cliente.created_at).toLocaleDateString("es-AR")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
              cliente.role === "admin"
                ? "bg-gc-dorado text-gc-negro"
                : "bg-gc-carbon text-gc-blanco/60"
            }`}
          >
            {cliente.role === "admin" ? "Admin" : "Cliente"}
          </span>
          <PromoteButton
            clienteId={cliente.id}
            rolActual={cliente.role}
            esUnoMismo={cliente.id === currentUser?.id}
          />
        </div>
      </div>

      <h2 className="mb-3 font-headline text-lg font-extrabold uppercase tracking-wide">
        Pedidos
      </h2>
      <div className="overflow-x-auto rounded-lg border border-gc-carbon">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gc-carbon bg-gc-carbon/30 text-xs uppercase text-gc-blanco/60">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(pedidos ?? []).map((pedido) => (
              <tr key={pedido.id} className="border-b border-gc-carbon/50 hover:bg-gc-carbon/20">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${pedido.id}`} className="font-bold hover:underline">
                    {pedido.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gc-blanco/70">
                  {new Date(pedido.created_at).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-3 font-stat">{formatPrice(pedido.total)}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gc-carbon px-2 py-0.5 text-xs font-bold">
                    {ESTADO_LABEL[pedido.estado] ?? pedido.estado}
                  </span>
                </td>
              </tr>
            ))}
            {(pedidos ?? []).length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gc-blanco/50" colSpan={4}>
                  Este cliente todavía no hizo ningún pedido.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
