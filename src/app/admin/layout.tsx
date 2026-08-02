import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/cupones", label: "Cupones" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gc-negro text-gc-blanco">
      <div className="flex">
        <aside className="min-h-screen w-56 shrink-0 border-r border-gc-carbon p-4">
          <Link href="/admin" className="mb-6 block font-headline text-sm font-extrabold uppercase tracking-wide">
            Ground Control <span className="text-gradient-cromo">90</span>
            <span className="ml-1 text-gc-blanco/40">Admin</span>
          </Link>
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
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
