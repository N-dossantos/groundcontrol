import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/utils/csv";

const COLUMNS = [
  "numero_pedido",
  "fecha",
  "cliente",
  "email",
  "telefono",
  "estado",
  "metodo_entrega",
  "subtotal",
  "envio",
  "descuento",
  "total",
];

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no_autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "no_autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");
  const q = searchParams.get("q");

  let query = supabase
    .from("orders")
    .select(
      "order_number, estado, metodo_entrega, subtotal, costo_envio, descuento, total, guest_email, guest_phone, created_at, profiles(nombre, apellido, telefono)"
    )
    .order("created_at", { ascending: false });

  if (estado) query = query.eq("estado", estado);
  if (q) query = query.ilike("order_number", `%${q}%`);

  const { data: orders, error } = await query;
  if (error) {
    return NextResponse.json({ error: "no_pudimos_exportar" }, { status: 500 });
  }

  const rows = (orders ?? []).map((order) => ({
    numero_pedido: order.order_number,
    fecha: order.created_at,
    cliente:
      [order.profiles?.nombre, order.profiles?.apellido].filter(Boolean).join(" ") || "Invitado",
    email: order.guest_email ?? "",
    telefono: order.guest_phone ?? order.profiles?.telefono ?? "",
    estado: order.estado,
    metodo_entrega: order.metodo_entrega,
    subtotal: order.subtotal,
    envio: order.costo_envio,
    descuento: order.descuento,
    total: order.total,
  }));

  const csv = toCsv(rows, COLUMNS);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
