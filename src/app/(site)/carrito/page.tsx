import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Carrito" };

export default function CarritoPage() {
  return <CartView />;
}
