import type { Metadata } from "next";
import { RegistroForm } from "@/components/auth/RegistroForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return <RegistroForm />;
}
