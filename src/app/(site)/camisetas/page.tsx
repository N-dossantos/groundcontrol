import type { Metadata } from "next";
import { CategoryPage } from "@/components/product/CategoryPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Camisetas" };

export default function CamisetasPage() {
  return (
    <CategoryPage
      tipo="camiseta"
      titulo="Camisetas"
      descripcion="Personalizables con nombre y número. Control en tu movimiento."
    />
  );
}
