import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", String(p));
    return `?${params.toString()}`;
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="mt-10 flex items-center justify-center gap-3 text-sm">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={prevDisabled}
        className={`rounded-md border border-gc-blanco/15 px-3 py-1.5 font-bold uppercase tracking-wide transition-colors ${
          prevDisabled ? "pointer-events-none opacity-30" : "hover:border-gc-blanco"
        }`}
      >
        Anterior
      </Link>
      <span className="px-2 text-gc-blanco/60">
        Página {page} de {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={nextDisabled}
        className={`rounded-md border border-gc-blanco/15 px-3 py-1.5 font-bold uppercase tracking-wide transition-colors ${
          nextDisabled ? "pointer-events-none opacity-30" : "hover:border-gc-blanco"
        }`}
      >
        Siguiente
      </Link>
    </nav>
  );
}
