import type { Metadata } from "next";
import { NuevoProductoForm } from "@/components/admin/NuevoProductoForm";

export const metadata: Metadata = { title: "Admin · Nuevo producto" };

export default function NuevoProductoPage() {
  return (
    <div>
      <h1 className="mb-6 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Nuevo producto
      </h1>
      <NuevoProductoForm />
    </div>
  );
}
