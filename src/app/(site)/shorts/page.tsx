import type { Metadata } from "next";
import { CategoryPage } from "@/components/product/CategoryPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Shorts" };

export default function ShortsPage() {
  return (
    <CategoryPage
      tipo="short"
      titulo="Shorts"
      descripcion="La base del rendimiento, para todos los deportistas."
    />
  );
}
