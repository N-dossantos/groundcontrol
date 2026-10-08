import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/utils/csv";

const COLUMNS = [
  "producto",
  "talle",
  "sku",
  "stock",
  "stock_minimo",
  "costo",
  "margen",
  "proveedor",
  "estado_produccion",
  "fecha_llegada_estimada",
  "cantidad_comprada",
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
    .select(
      "nombre, precio, product_variants(talle, sku, stock, stock_minimo, costos:product_variant_costos(*))"
    )
    .order("nombre", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "no_pudimos_exportar" }, { status: 500 });
  }

  const rows = (products ?? []).flatMap((product) =>
    product.product_variants.map((variant) => ({
      producto: product.nombre,
      talle: variant.talle,
      sku: variant.sku,
      stock: variant.stock,
      stock_minimo: variant.stock_minimo,
      costo: variant.costos?.costo ?? "",
      margen: variant.costos?.costo != null ? product.precio - variant.costos.costo : "",
      proveedor: variant.costos?.proveedor ?? "",
      estado_produccion: variant.costos?.estado_produccion ?? "",
      fecha_llegada_estimada: variant.costos?.fecha_llegada_estimada ?? "",
      cantidad_comprada: variant.costos?.cantidad_comprada ?? "",
    }))
  );

  const csv = toCsv(rows, COLUMNS);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="productos-variantes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
