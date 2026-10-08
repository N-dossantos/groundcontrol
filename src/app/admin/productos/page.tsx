import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/product/Pagination";

export const metadata: Metadata = { title: "Admin · Productos" };

const PAGE_SIZE = 50;

const TIPO_LABEL: Record<string, string> = {
  camiseta: "Camiseta",
  short: "Short",
  conjunto: "Conjunto",
};

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: products, count } = await supabase
    .from("products")
    .select("id, nombre, tipo, club, precio, activo, product_variants(stock)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-headline text-2xl font-extrabold uppercase tracking-wide">
          Productos
        </h1>
        <div className="flex gap-3">
          <a
            href="/api/admin/productos/export"
            className="rounded-md border border-gc-blanco/15 px-4 py-2 text-sm font-bold uppercase hover:border-gc-blanco"
          >
            Exportar CSV
          </a>
          <a
            href="/api/admin/productos/export-variantes"
            className="rounded-md border border-gc-blanco/15 px-4 py-2 text-sm font-bold uppercase hover:border-gc-blanco"
          >
            Exportar CSV (variantes)
          </a>
          <Link href="/admin/productos/nuevo">
            <Button>+ Nuevo producto</Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gc-carbon">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gc-carbon bg-gc-carbon/30 text-xs uppercase text-gc-blanco/60">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((product) => {
              const stock = product.product_variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={product.id} className="border-b border-gc-carbon/50 hover:bg-gc-carbon/20">
                  <td className="px-4 py-3">
                    <Link href={`/admin/productos/${product.id}`} className="font-bold hover:underline">
                      {product.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gc-blanco/70">{TIPO_LABEL[product.tipo] ?? product.tipo}</td>
                  <td className="px-4 py-3 text-gc-blanco/70">{product.club ?? "—"}</td>
                  <td className="px-4 py-3 font-stat">{formatPrice(product.precio)}</td>
                  <td className="px-4 py-3 font-stat">{stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        product.activo ? "bg-gc-dorado text-gc-negro" : "bg-gc-carbon text-gc-blanco/60"
                      }`}
                    >
                      {product.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} searchParams={{ page: pageParam }} />
    </div>
  );
}
