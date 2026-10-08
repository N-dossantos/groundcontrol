import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/utils/csv";

const COLUMNS = [
  "nombre",
  "tipo",
  "club",
  "liga",
  "temporada",
  "precio",
  "stock_total",
  "activo",
  "destacado",
  "created_at",
];

export async function GET() {
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

  const { data: products, error } = await supabase
    .from("products")
    .select("nombre, tipo, club, liga, temporada, precio, activo, destacado, created_at, product_variants(stock)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "no_pudimos_exportar" }, { status: 500 });
  }

  const rows = (products ?? []).map((product) => ({
    nombre: product.nombre,
    tipo: product.tipo,
    club: product.club ?? "",
    liga: product.liga ?? "",
    temporada: product.temporada ?? "",
    precio: product.precio,
    stock_total: product.product_variants.reduce((sum, v) => sum + v.stock, 0),
    activo: product.activo,
    destacado: product.destacado,
    created_at: product.created_at,
  }));

  const csv = toCsv(rows, COLUMNS);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="productos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
