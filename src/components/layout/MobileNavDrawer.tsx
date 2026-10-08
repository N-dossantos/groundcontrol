"use client";

import Link from "next/link";
import Image from "next/image";
import { X, ChevronRight, MessageCircle, Sparkles } from "lucide-react";

type MobileNavDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  navLinks: { href: string; label: string }[];
  whatsappNumero: string;
};

export function MobileNavDrawer({
  isOpen,
  onClose,
  navLinks,
  whatsappNumero,
}: MobileNavDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Fondo Oscuro Backdrop */}
      <div
        className="fixed inset-0 bg-gc-negro/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel Drawer Deslizante */}
      <div className="relative flex w-full max-w-xs flex-col bg-gc-negro border-r border-gc-carbon shadow-2xl z-10 transition-transform duration-300">
        {/* Cabecera del Drawer */}
        <div className="flex h-16 items-center justify-between border-b border-gc-carbon px-4">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="Ground Control 90"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-headline text-base font-extrabold uppercase tracking-tight text-gc-blanco">
              Ground Control <span className="text-gradient-cromo">90</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-gc-blanco/70 hover:bg-gc-carbon hover:text-gc-blanco"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links de Navegación */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gc-blanco/40">
            Navegación
          </p>
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between rounded-lg px-3 py-3 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco/90 transition-colors hover:bg-gc-carbon hover:text-gc-blanco"
              >
                <span>{link.label}</span>
                <ChevronRight size={16} className="text-gc-blanco/40" />
              </Link>
            ))}
          </nav>

          <div className="my-6 border-t border-gc-carbon" />

          {/* Información y Venta Conversacional */}
          <div className="rounded-xl border border-gc-carbon bg-gc-carbon/30 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gc-dorado">
              <Sparkles size={14} />
              <span>Canning, Buenos Aires</span>
            </div>
            <p className="mt-1 text-xs text-gc-blanco/60">
              Puntos de encuentro y envíos a todo el país.
            </p>
            <a
              href={`https://wa.me/${whatsappNumero}?text=${encodeURIComponent(
                "Hola! Quería consultar por un pedido de camisetas/conjuntos."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-gc-dorado/15 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-gc-dorado transition-colors hover:bg-gc-dorado/25"
            >
              <MessageCircle size={16} />
              Consultar por WhatsApp
            </a>
          </div>
        </div>

        {/* Pie del Drawer */}
        <div className="border-t border-gc-carbon p-4 text-center text-xs text-gc-blanco/40">
          © Ground Control 90 · Control en tu movimiento
        </div>
      </div>
    </div>
  );
}
