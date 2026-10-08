"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils/format";

const ESTADOS = [
  "pendiente_pago",
  "pagado",
  "en_preparacion",
  "enviado",
  "entregado",
  "cancelado",
  "reembolsado",
  "reembolsado_parcial",
] as const;

const ESTADO_LABEL: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  reembolsado_parcial: "Reembolsado parcialmente",
};

const REEMBOLSABLE = ["pagado", "en_preparacion", "enviado", "entregado", "reembolsado_parcial"];

export function AdminOrderActions({
  orderId,
  estadoActual,
  montoMaximoReembolso,
}: {
  orderId: string;
  estadoActual: string;
  montoMaximoReembolso: number;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoActual);
  const [guardando, setGuardando] = useState(false);
  const [reembolsando, setReembolsando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoReembolso, setConfirmandoReembolso] = useState(false);
  const [montoReembolso, setMontoReembolso] = useState("");

  async function handleActualizarEstado() {
    setGuardando(true);
    setError(null);
    setMensaje(null);

    const res = await fetch(`/api/admin/pedidos/${orderId}/estado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    setGuardando(false);
    if (!res.ok) {
      setError("No pudimos actualizar el estado.");
      return;
    }
    setMensaje("Estado actualizado. Le avisamos al cliente por email.");
    router.refresh();
  }

  async function handleReembolsar() {
    setConfirmandoReembolso(false);
    setReembolsando(true);
    setError(null);
    setMensaje(null);

    const amount = montoReembolso.trim() ? Number(montoReembolso) : undefined;

    const res = await fetch(`/api/admin/pedidos/${orderId}/reembolsar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();

    setReembolsando(false);
    if (!res.ok) {
      const MENSAJES_ERROR: Record<string, string> = {
        pago_aprobado_no_encontrado: "No encontramos un pago aprobado para este pedido.",
        monto_supera_lo_pendiente: "Ese monto supera lo que todavía se puede reembolsar.",
      };
      setError(MENSAJES_ERROR[data.error] ?? "No pudimos procesar el reembolso.");
      return;
    }

    setMontoReembolso("");
    setMensaje(
      data.yaReembolsado
        ? "Este pedido ya estaba reembolsado."
        : data.estado === "reembolsado_parcial"
          ? "Reembolso parcial procesado."
          : "Reembolso procesado."
    );
    setEstado(data.yaReembolsado ? "reembolsado" : data.estado);
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gc-blanco/70">
          Estado del pedido
        </label>
        <div className="flex gap-2">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABEL[e]}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            isLoading={guardando}
            onClick={handleActualizarEstado}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {REEMBOLSABLE.includes(estadoActual) &&
        (confirmandoReembolso ? (
          <div className="space-y-3 rounded-md border border-red-500/40 bg-red-500/10 p-3">
            <div>
              <Label htmlFor="montoReembolso">
                Monto a reembolsar (dejar vacío para el total pendiente:{" "}
                {formatPrice(montoMaximoReembolso)})
              </Label>
              <Input
                id="montoReembolso"
                type="number"
                step="0.01"
                min="0"
                max={montoMaximoReembolso || undefined}
                placeholder={String(montoMaximoReembolso)}
                value={montoReembolso}
                onChange={(e) => setMontoReembolso(e.target.value)}
              />
            </div>
            <p className="text-sm text-gc-blanco">
              ¿Confirmás el reembolso de este pedido en Mercado Pago? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="danger"
                isLoading={reembolsando}
                onClick={handleReembolsar}
              >
                Sí, reembolsar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirmandoReembolso(false);
                  setMontoReembolso("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="danger" onClick={() => setConfirmandoReembolso(true)}>
            Reembolsar
          </Button>
        ))}

      {mensaje && <p className="text-sm text-gc-dorado">{mensaje}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
