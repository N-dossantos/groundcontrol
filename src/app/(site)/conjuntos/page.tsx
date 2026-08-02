import type { Metadata } from "next";
import { CategoryPage } from "@/components/product/CategoryPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Conjuntos" };

export default function ConjuntosPage() {
  return (
    <CategoryPage
      tipo="conjunto"
      titulo="Conjuntos"
      descripcion="Camiseta y short en un mismo pack, con precio especial."
    />
  );
}
