import type { Metadata } from "next";
import { ActualizarPasswordForm } from "@/components/auth/ActualizarPasswordForm";

export const metadata: Metadata = { title: "Actualizar contraseña" };

export default function ActualizarPasswordPage() {
  return <ActualizarPasswordForm />;
}
