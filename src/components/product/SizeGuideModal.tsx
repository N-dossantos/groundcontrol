"use client";

import { X, Ruler } from "lucide-react";

type SizeGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MEDIDAS_CAMISETAS = [
  { talle: "S", ancho: "48 cm", largo: "70 cm" },
  { talle: "M", ancho: "51 cm", largo: "72 cm" },
  { talle: "L", ancho: "54 cm", largo: "75 cm" },
  { talle: "XL", ancho: "57 cm", largo: "78 cm" },
  { talle: "XXL", ancho: "60 cm", largo: "81 cm" },
];

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gc-negro/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gc-carbon bg-gc-negro p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gc-carbon pb-4">
          <div className="flex items-center gap-2 font-headline text-lg font-extrabold uppercase tracking-wide text-gc-blanco">
            <Ruler size={20} className="text-gc-dorado" />
            <span>Guía de Talles y Medidas</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía de talles"
            className="rounded-lg p-1.5 text-gc-blanco/60 hover:bg-gc-carbon hover:text-gc-blanco"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs text-gc-blanco/80">
          <p className="text-gc-blanco/70">
            Medí una prenda tuya estirada sobre una superficie plana (Ancho de axila a axila y Largo de hombro a cintura).
          </p>

          <div className="overflow-x-auto rounded-xl border border-gc-carbon">
            <table className="w-full text-left text-xs">
              <thead className="bg-gc-carbon/60 text-gc-dorado font-headline uppercase">
                <tr>
                  <th className="px-4 py-2.5">Talle</th>
                  <th className="px-4 py-2.5">Ancho (Axila a Axila)</th>
                  <th className="px-4 py-2.5">Largo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gc-carbon bg-gc-carbon/20 font-mono">
                {MEDIDAS_CAMISETAS.map((m) => (
                  <tr key={m.talle} className="hover:bg-gc-carbon/40 transition-colors">
                    <td className="px-4 py-2 font-bold text-gc-blanco">{m.talle}</td>
                    <td className="px-4 py-2">{m.ancho}</td>
                    <td className="px-4 py-2">{m.largo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-gc-carbon bg-gc-carbon/30 p-3 text-[11px] text-gc-blanco/60">
            💡 <strong className="text-gc-blanco">Recomendación:</strong> Si preferís un calce holgado o dudás entre dos talles, sugerimos elegir un talle más.
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gc-carbon px-6 py-2 text-xs font-bold uppercase tracking-wider text-gc-blanco hover:bg-gc-carbon/80 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
