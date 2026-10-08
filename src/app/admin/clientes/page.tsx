import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Clientes" };

export default async function AdminClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("profiles")
    .select("id, nombre, apellido, telefono, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Clientes
      </h1>
      <div className="overflow-hidden rounded-lg border border-gc-carbon">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gc-carbon bg-gc-carbon/30 text-xs uppercase text-gc-blanco/60">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {(clientes ?? []).map((cliente) => (
              <tr key={cliente.id} className="border-b border-gc-carbon/50 hover:bg-gc-carbon/20">
                <td className="px-4 py-3">
                  <Link href={`/admin/clientes/${cliente.id}`} className="font-bold hover:underline">
                    {[cliente.nombre, cliente.apellido].filter(Boolean).join(" ") || "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gc-blanco/70">{cliente.telefono ?? "—"}</td>
                <td className="px-4 py-3 text-gc-blanco/70">
                  {new Date(cliente.created_at).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
