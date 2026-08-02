"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const TIPOS = [
  { value: "", label: "Todos" },
  { value: "camiseta", label: "Camisetas" },
  { value: "short", label: "Shorts" },
  { value: "conjunto", label: "Conjuntos" },
];

const TALLES = ["S", "M", "L", "XL", "XXL"];

export function ProductFilters({ clubes }: { clubes: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value), 400);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <select
        value={searchParams.get("tipo") ?? ""}
        onChange={(e) => setParam("tipo", e.target.value)}
        className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
      >
        {TIPOS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("club") ?? ""}
        onChange={(e) => setParam("club", e.target.value)}
        className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
      >
        <option value="">Todos los clubes</option>
        {clubes.map((club) => (
          <option key={club} value={club}>
            {club}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("talle") ?? ""}
        onChange={(e) => setParam("talle", e.target.value)}
        className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
      >
        <option value="">Todos los talles</option>
        {TALLES.map((talle) => (
          <option key={talle} value={talle}>
            {talle}
          </option>
        ))}
      </select>

      <input
        type="search"
        placeholder="Buscar..."
        value={q}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco placeholder:text-gc-blanco/40"
      />
    </div>
  );
}
