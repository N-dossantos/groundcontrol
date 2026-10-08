"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function PromoteButton({
  clienteId,
  rolActual,
  esUnoMismo,
}: {
  clienteId: string;
  rolActual: string;
  esUnoMismo: boolean;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (esUnoMismo) return null;

  async function handleCambiarRol(nuevoRol: "admin" | "customer") {
    setCargando(true);
    setError(null);

    const res = await fetch(`/api/admin/clientes/${clienteId}/rol`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nuevoRol }),
    });

    setCargando(false);
    if (!res.ok) {
      setError("No pudimos actualizar el rol.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={rolActual === "admin" ? "secondary" : "dorado"}
        isLoading={cargando}
        onClick={() => handleCambiarRol(rolActual === "admin" ? "customer" : "admin")}
      >
        {rolActual === "admin" ? "Quitar admin" : "Promover a admin"}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
