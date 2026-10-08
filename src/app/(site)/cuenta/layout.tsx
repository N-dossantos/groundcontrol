import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV = [
  { href: "/cuenta", label: "Resumen" },
  { href: "/cuenta/perfil", label: "Perfil" },
  { href: "/cuenta/direcciones", label: "Direcciones" },
  { href: "/cuenta/pedidos", label: "Pedidos" },
  { href: "/cuenta/favoritos", label: "Favoritos" },
];

export default function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Mi cuenta
      </h1>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-gc-blanco/70 transition-colors hover:bg-gc-carbon hover:text-gc-blanco"
            >
              {item.label}
            </Link>
          ))}
          <SignOutButton />
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
