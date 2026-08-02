import Link from "next/link";
import { MapPin, Truck, Shirt, Users, Heart, Sparkles } from "lucide-react";

export function QuienesSomos() {
  return (
    <section id="quienes-somos" className="border-t border-gc-carbon bg-gc-negro py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header de Sección */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gc-carbon bg-gc-carbon/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gc-dorado">
            <Sparkles size={14} className="text-gc-dorado" />
            Nuestra Historia
          </div>
          <h2 className="font-headline text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Quiénes <span className="text-gradient-cromo">Somos</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-gc-blanco/70 sm:text-base">
            Control en tu movimiento. La base del rendimiento para todos los deportistas.
          </p>
        </div>

        {/* Cita Principal / Frase de Marca */}
        <div className="relative mb-16 overflow-hidden rounded-2xl border border-gc-carbon bg-gradient-to-b from-gc-carbon/80 to-gc-negro p-8 text-center sm:p-12">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gc-dorado/5 blur-3xl" />
          <blockquote className="relative z-10 font-headline text-xl font-bold italic leading-relaxed text-gc-blanco sm:text-2xl">
            &ldquo;Emprendí en Argentina, me arriesgué y las cosas lindas llegaron al golpito.&rdquo;
          </blockquote>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gc-dorado">
            — Fundador de Ground Control 90 · Canning, Buenos Aires
          </p>
        </div>

        {/* Grid de Contenido Principal */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Historia y Filosofía */}
          <div className="space-y-6 text-gc-blanco/80 text-sm sm:text-base leading-relaxed">
            <h3 className="font-headline text-2xl font-extrabold uppercase tracking-wide text-gc-blanco">
              Pasión por la Camiseta
            </h3>
            <p>
              <strong className="text-gc-blanco">Ground Control 90</strong> nació en Canning, Buenos Aires, como un emprendimiento independiente impulsado por la cultura y el amor incondicional por el fútbol argentino.
            </p>
            <p>
              Nos especializamos en <strong className="text-gc-blanco">indumentaria deportiva, camisetas personalizadas y conjuntos</strong>. Creemos que la ropa no es solo tela: es identidad, pertenencia y rendimiento en la cancha. Cada pedido se prepara con atención personalizada, cuidando cada detalle como el estampado de nombres, números y parches.
            </p>
            <p>
              Trabajamos con venta directa sin intermediarios, combinando un servicio cercano por Instagram y WhatsApp con entregas eficientes y seguras.
            </p>

            <div className="pt-2">
              <Link
                href="/quienes-somos"
                className="inline-flex items-center gap-2 rounded-full border border-gc-blanco/30 bg-gc-carbon/40 px-6 py-3 font-headline text-xs font-extrabold uppercase tracking-wider text-gc-blanco transition-all hover:border-gc-blanco hover:bg-gc-carbon"
              >
                Conocé nuestra historia completa →
              </Link>
            </div>
          </div>

          {/* Pilares / Tarjetas de Valor */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gc-carbon bg-gc-carbon/30 p-6 transition-all hover:border-gc-carbon/80">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gc-carbon bg-gc-negro text-gc-dorado">
                <MapPin size={24} />
              </div>
              <h4 className="font-headline text-base font-bold uppercase tracking-wide text-gc-blanco">
                Canning, Buenos Aires
              </h4>
              <p className="mt-2 text-xs text-gc-blanco/60">
                Puntos de encuentro coordinados y atención directa y local.
              </p>
            </div>

            <div className="rounded-xl border border-gc-carbon bg-gc-carbon/30 p-6 transition-all hover:border-gc-carbon/80">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gc-carbon bg-gc-negro text-gc-dorado">
                <Truck size={24} />
              </div>
              <h4 className="font-headline text-base font-bold uppercase tracking-wide text-gc-blanco">
                Envíos a todo el País
              </h4>
              <p className="mt-2 text-xs text-gc-blanco/60">
                Despachamos a toda Argentina rápido y seguro a través de Andreani.
              </p>
            </div>

            <div className="rounded-xl border border-gc-carbon bg-gc-carbon/30 p-6 transition-all hover:border-gc-carbon/80">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gc-carbon bg-gc-negro text-gc-dorado">
                <Shirt size={24} />
              </div>
              <h4 className="font-headline text-base font-bold uppercase tracking-wide text-gc-blanco">
                Personalización
              </h4>
              <p className="mt-2 text-xs text-gc-blanco/60">
                Estampado de tu nombre, número favorito y parches de torneos.
              </p>
            </div>

            <div className="rounded-xl border border-gc-carbon bg-gc-carbon/30 p-6 transition-all hover:border-gc-carbon/80">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gc-carbon bg-gc-negro text-gc-dorado">
                <Users size={24} />
              </div>
              <h4 className="font-headline text-base font-bold uppercase tracking-wide text-gc-blanco">
                +21.000 Hinchas
              </h4>
              <p className="mt-2 text-xs text-gc-blanco/60">
                Una gran comunidad en Instagram que confía en nosotros día a día.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
