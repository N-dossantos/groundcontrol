import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";

export const metadata: Metadata = { title: "Admin · Detalle de pedido" };

const METODO_ENTREGA_LABEL: Record<string, string> = {
  retiro_punto_encuentro: "Retiro en punto de encuentro",
  envio_domicilio: "Envío a domicilio",
};

export default async function AdminPedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: payment } = await supabase
    .from("payments")
    .select("monto, monto_reembolsado")
    .eq("order_id", order.id)
    .in("estado", ["aprobado", "reembolsado_parcial"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const montoMaximoReembolso = payment ? payment.monto - payment.monto_reembolsado : 0;

  let contactoNombre = order.guest_email ? "Invitado" : null;
  let contactoTelefono = order.guest_phone;

  if (order.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre, apellido, telefono")
      .eq("id", order.user_id)
      .single();
    contactoNombre = [profile?.nombre, profile?.apellido].filter(Boolean).join(" ") || "Usuario";
    contactoTelefono = profile?.telefono ?? contactoTelefono;
  }

  const direccion = order.direccion_envio as {
    calle?: string;
    numero?: string;
    pisoDepto?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
  } | null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <h1 className="mb-6 font-headline text-2xl font-extrabold uppercase tracking-wide">
          Pedido {order.order_number}
        </h1>

        <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gc-blanco/50">
              <tr>
                <th className="pb-2">Producto</th>
                <th className="pb-2 text-center">Cant.</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr key={item.id} className="border-t border-gc-carbon">
                  <td className="py-2">
                    {item.product_nombre_snapshot} · Talle {item.talle_snapshot}
                    {(item.nombre_estampado || item.numero_estampado) && (
                      <span className="block text-xs text-gc-blanco/50">
                        {[item.nombre_estampado, item.numero_estampado].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-center">{item.cantidad}</td>
                  <td className="py-2 text-right font-stat">{formatPrice(item.subtotal_item)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-1 border-t border-gc-carbon pt-4 text-sm">
            <div className="flex justify-between text-gc-blanco/70">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gc-blanco/70">
              <span>Envío</span>
              <span>{formatPrice(order.costo_envio)}</span>
            </div>
            {order.descuento > 0 && (
              <div className="flex justify-between text-gc-dorado">
                <span>Descuento</span>
                <span>-{formatPrice(order.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 font-stat text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4 text-sm">
          <p className="mb-2 font-bold uppercase tracking-wide text-gc-blanco/60">Contacto</p>
          <p>{contactoNombre}</p>
          <p className="text-gc-blanco/70">{order.guest_email}</p>
          <p className="text-gc-blanco/70">{contactoTelefono}</p>

          <p className="mb-2 mt-4 font-bold uppercase tracking-wide text-gc-blanco/60">Entrega</p>
          <p>{METODO_ENTREGA_LABEL[order.metodo_entrega] ?? order.metodo_entrega}</p>
          {direccion && (
            <p className="text-gc-blanco/70">
              {direccion.calle} {direccion.numero}
              {direccion.pisoDepto ? `, ${direccion.pisoDepto}` : ""} — {direccion.ciudad},{" "}
              {direccion.provincia} ({direccion.codigoPostal})
            </p>
          )}
        </div>
      </div>

      <div>
        <AdminOrderActions
          orderId={order.id}
          estadoActual={order.estado}
          montoMaximoReembolso={montoMaximoReembolso}
          metodoEntrega={order.metodo_entrega}
          andreaniNumeroEnvio={order.andreani_numero_envio}
        />
      </div>
    </div>
  );
}
