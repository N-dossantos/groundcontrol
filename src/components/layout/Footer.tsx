import Link from "next/link";
import { WhatsAppButton } from "./WhatsAppButton";

type FooterProps = {
  whatsappNumero: string;
  puntoEncuentroDescripcion?: string;
};

export function Footer({ whatsappNumero, puntoEncuentroDescripcion }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-gc-carbon bg-gc-negro">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <h3 className="font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco">
            Ground Control 90
          </h3>
          <p className="mt-2 text-sm text-gc-blanco/70">
            Control en tu movimiento. La base del rendimiento para todos los
            deportistas.
          </p>
          <Link
            href="/quienes-somos"
            className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-gc-dorado hover:underline"
          >
            ► Conoce nuestra historia
          </Link>
        </div>

        <div>
          <h3 className="font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco">
            Entrega
          </h3>
          <p className="mt-2 text-sm text-gc-blanco/70">
            <span className="bullet block">
              {puntoEncuentroDescripcion ?? "Puntos de encuentro en Canning, Buenos Aires"}
            </span>
            <span className="bullet mt-1 block">Envíos a todo el país</span>
          </p>
        </div>

        <div>
          <h3 className="font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco">
            Contacto
          </h3>
          <WhatsAppButton
            numero={whatsappNumero}
            mensaje="Hola! Quería hacer una consulta sobre un pedido."
            className="mt-2 inline-block text-sm font-bold text-gc-dorado hover:underline"
          >
            ► Escribinos por WhatsApp
          </WhatsAppButton>
        </div>
      </div>

      <div className="border-t border-gc-carbon px-4 py-4 text-center text-xs text-gc-blanco/50">
        © {new Date().getFullYear()} Ground Control 90 ·{" "}
        <Link href="/" className="hover:text-gc-blanco/80">
          Canning, Buenos Aires, Argentina
        </Link>
      </div>
    </footer>
  );
}
