"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/catalogo?q=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Buscar producto"
        className="text-gc-blanco/80 transition-colors hover:text-gc-blanco p-1"
      >
        <Search size={22} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gc-negro/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal de búsqueda */}
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-gc-carbon bg-gc-negro p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <Search size={20} className="text-gc-dorado shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar camisetas, conjuntos, clubes (ej. Messi, Boca, Real Madrid)..."
                className="flex-1 bg-transparent text-sm font-medium text-gc-blanco placeholder:text-gc-blanco/40 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-gc-blanco/40 hover:text-gc-blanco text-xs font-bold"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-gc-blanco/60 hover:bg-gc-carbon hover:text-gc-blanco"
              >
                <X size={18} />
              </button>
            </form>

            <div className="mt-4 border-t border-gc-carbon pt-3 flex flex-wrap gap-2 text-xs">
              <span className="text-gc-blanco/40 self-center">Búsquedas populares:</span>
              {["Camisetas", "Conjuntos", "Argentina", "Messi", "Shorts"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    router.push(`/catalogo?q=${encodeURIComponent(term)}`);
                    setIsOpen(false);
                  }}
                  className="rounded-full border border-gc-carbon bg-gc-carbon/40 px-3 py-1 text-gc-blanco/80 hover:border-gc-blanco hover:text-gc-blanco transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
