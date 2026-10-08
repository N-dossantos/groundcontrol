import type { EventoTrazabilidad } from "@/lib/andreani/envios";

// Timeline genérico de checkpoints, no un stepper de 5 etapas fijas: el
// vocabulario real de `estado` que devuelve Andreani no se pudo confirmar
// contra la documentación oficial en esta sesión (ver ECOMMERCE_ROADMAP.md,
// Phase 7d) — mapear a estados fijos ("retirado", "en tránsito", etc.)
// arriesgaría inventar un estado que nunca llega o perderse uno real. Se
// muestra lo que la API efectivamente devuelve, más reciente primero.
export function ShipmentTracking({
  numeroEnvio,
  eventos,
}: {
  numeroEnvio: string;
  eventos: EventoTrazabilidad[];
}) {
  return (
    <div className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4 text-left">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gc-blanco/60">
        Seguimiento del envío · n.º {numeroEnvio}
      </p>

      {eventos.length === 0 ? (
        <p className="text-sm text-gc-blanco/70">
          Todavía no hay novedades — el envío fue creado y está esperando ser retirado.
        </p>
      ) : (
        <ol className="space-y-3 border-l-2 border-gc-dorado/40 pl-4">
          {eventos.map((evento, i) => (
            <li key={`${evento.fecha}-${i}`} className="relative text-sm">
              <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-gc-dorado" />
              <span className="block font-bold text-gc-blanco">{evento.estado}</span>
              <span className="block text-xs text-gc-blanco/50">{evento.fecha}</span>
              {evento.comentario && (
                <span className="block text-xs text-gc-blanco/70">{evento.comentario}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
