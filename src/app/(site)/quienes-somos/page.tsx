import Metadata from "next";
import Link from "next/link";
import { QuienesSomos } from "@/components/QuienesSomos";
import { CheckCircle2, ShieldCheck, Truck, MessageCircle, Heart, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Quiénes Somos | Ground Control 90",
  description: "Conocé la historia de Ground Control 90, indumentaria deportiva y camisetas de fútbol personalizadas en Canning, Buenos Aires.",
};

export default function QuienesSomosPage() {
  return (
    <main className="min-h-screen bg-gc-negro text-gc-blanco">
      {/* Banner Superior Hero */}
      <section className="relative overflow-hidden border-b border-gc-carbon bg-gradient-to-b from-gc-carbon/60 via-gc-negro to-gc-negro py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-block font-headline text-xs font-extrabold uppercase tracking-widest text-gc-dorado">
            Canning, Buenos Aires · Argentina
          </span>
          <h1 className="font-headline text-4xl font-extrabold uppercase leading-tight sm:text-6xl">
            La Historia Detrás de <br className="hidden sm:inline" />
            <span className="text-gradient-cromo">Ground Control 90</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-gc-blanco/80 sm:text-lg">
            De la pasión por el fútbol argentino a una marca construida con esfuerzo, riesgo y dedicación para los hinchas de todo el país.
          </p>
        </div>
      </section>

      {/* Componente Principal de Información */}
      <QuienesSomos />

      {/* Sección Detallada: Valores y Proceso */}
      <section className="border-t border-gc-carbon bg-gc-carbon/20 py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-headline text-2xl font-extrabold uppercase tracking-wide sm:text-3xl mb-12">
            Nuestro Compromiso
          </h2>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-gc-carbon bg-gc-negro p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gc-dorado/10 text-gc-dorado">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-headline text-lg font-bold uppercase tracking-wide text-gc-blanco">
                100% Calidad Garantizada
              </h3>
              <p className="mt-2 text-xs text-gc-blanco/70 leading-relaxed">
                Seleccionamos cada prenda y conjunto con estándares rigurosos de durabilidad, comodidad y terminación profesional.
              </p>
            </div>

            <div className="rounded-2xl border border-gc-carbon bg-gc-negro p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gc-dorado/10 text-gc-dorado">
                <Truck size={20} />
              </div>
              <h3 className="font-headline text-lg font-bold uppercase tracking-wide text-gc-blanco">
                Logística Segura
              </h3>
              <p className="mt-2 text-xs text-gc-blanco/70 leading-relaxed">
                Coordinación directa de entregas en Canning o despacho inmediato con código de seguimiento mediante Andreani.
              </p>
            </div>

            <div className="rounded-2xl border border-gc-carbon bg-gc-negro p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gc-dorado/10 text-gc-dorado">
                <MessageCircle size={20} />
              </div>
              <h3 className="font-headline text-lg font-bold uppercase tracking-wide text-gc-blanco">
                Atención Humana & Cercana
              </h3>
              <p className="mt-2 text-xs text-gc-blanco/70 leading-relaxed">
                Sin bots ni respuestas genéricas. Te asesoramos directamente por WhatsApp e Instagram para armar tu pedido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t border-gc-carbon py-16 px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-headline text-2xl font-extrabold uppercase tracking-tight sm:text-4xl">
            ¿Listo para elegir tu indumentaria?
          </h2>
          <p className="mt-4 text-sm text-gc-blanco/70 sm:text-base">
            Explorá nuestro catálogo de camisetas, shorts y conjuntos.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-full bg-gc-blanco px-8 py-3.5 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-negro transition-opacity hover:opacity-90"
            >
              Ver Catálogo Completo <ArrowRight size={16} />
            </Link>
            <Link
              href="/conjuntos"
              className="inline-flex items-center gap-2 rounded-full border border-gc-blanco/30 px-8 py-3.5 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco transition-colors hover:border-gc-blanco"
            >
              Conjuntos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
