import type { Metadata } from "next";
import { RecuperarPasswordForm } from "@/components/auth/RecuperarPasswordForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPasswordPage() {
  return <RecuperarPasswordForm />;
}
