"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Menu } from "lucide-react";
import { CartBadge } from "@/components/cart/CartBadge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { HeaderSearch } from "./HeaderSearch";
import { MobileNavDrawer } from "./MobileNavDrawer";

const NAV_LINKS = [
  { href: "/camisetas", label: "Camisetas" },
  { href: "/shorts", label: "Shorts" },
  { href: "/conjuntos", label: "Conjuntos" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/quienes-somos", label: "Quiénes Somos" },
];

const WHATSAPP_NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491100000000";

export function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gc-carbon bg-gc-negro/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {/* Botón Hamburguesa en Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Abrir menú de navegación"
              className="rounded-lg p-1.5 text-gc-blanco/80 transition-colors hover:bg-gc-carbon hover:text-gc-blanco md:hidden"
            >
              <Menu size={22} />
            </button>

            {/* Logo e Isologo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.jpg"
                alt="Ground Control 90"
                width={38}
                height={38}
                className="rounded-full"
                priority
              />
              <span className="font-headline text-lg font-extrabold uppercase tracking-tight text-gc-blanco">
                Ground Control <span className="text-gradient-cromo">90</span>
              </span>
            </Link>
          </div>

          {/* Nav en Desktop */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-headline text-xs font-extrabold uppercase tracking-wider text-gc-blanco/80 transition-colors hover:text-gc-blanco"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Acciones de la Cabecera */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            <HeaderSearch />
            <Link
              href="/cuenta"
              aria-label="Mi cuenta"
              className="text-gc-blanco/80 transition-colors hover:text-gc-blanco"
            >
              <User size={22} />
            </Link>
            <CartBadge />
          </div>
        </div>
      </header>

      {/* Menú Mobile Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        navLinks={NAV_LINKS}
        whatsappNumero={WHATSAPP_NUMERO}
      />

      {/* Carrito Desplegable Drawer */}
      <CartDrawer />
    </>
  );
}
