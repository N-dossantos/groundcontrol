"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkoutFormSchema,
  type CheckoutFormInput,
} from "@/lib/validations/checkout";
import { useCartStore, cartSubtotal } from "@/lib/cart/store";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { useHydrated } from "@/lib/hooks/useHydrated";

const ERROR_MESSAGES: Record<string, string> = {
  carrito_vacio: "Tu carrito está vacío.",
  sin_stock: "Alguno de los productos ya no tiene stock suficiente. Revisá tu carrito.",
  producto_invalido: "Uno de los productos del carrito ya no está disponible.",
  cupon_invalido: "El cupón ingresado no es válido.",
  error_pasarela_pago: "No pudimos conectar con Mercado Pago. Intentá de nuevo en unos minutos.",
  error_desconocido: "Algo salió mal. Intentá de nuevo.",
};

export function CheckoutForm({
  initialContacto,
  costoEnvioDomicilio,
  puntoEncuentroDescripcion,
}: {
  initialContacto?: { nombre?: string; email?: string; telefono?: string };
  costoEnvioDomicilio: number;
  puntoEncuentroDescripcion: string;
}) {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const mounted = useHydrated();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cuponInput, setCuponInput] = useState("");
  const [cuponEstado, setCuponEstado] = useState<
    | { status: "validando" }
    | { status: "aplicado"; codigo: string; descuento: number }
    | { status: "invalido"; motivo: string }
    | null
  >(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      metodoEntrega: "retiro_punto_encuentro",
      contacto: initialContacto,
    },
  });

  const metodoEntrega = watch("metodoEntrega");
  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const costoEnvio = metodoEntrega === "envio_domicilio" ? costoEnvioDomicilio : 0;
  const descuento = cuponEstado?.status === "aplicado" ? cuponEstado.descuento : 0;
  const total = subtotal + costoEnvio - descuento;

  async function handleAplicarCupon() {
    if (!cuponInput.trim()) return;
    setCuponEstado({ status: "validando" });

    const res = await fetch("/api/cupones/validar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: cuponInput.trim(), subtotal }),
    });
    const data = await res.json();

    if (data.valido) {
      setCuponEstado({ status: "aplicado", codigo: cuponInput.trim(), descuento: data.descuento });
    } else {
      setCuponEstado({ status: "invalido", motivo: data.motivo ?? "cupon_invalido" });
    }
  }

  async function onSubmit(data: CheckoutFormInput) {
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError(ERROR_MESSAGES.carrito_vacio);
      return;
    }

    const res = await fetch("/api/checkout/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          cantidad: item.cantidad,
          nombreEstampado: item.nombreEstampado,
          numeroEstampado: item.numeroEstampado,
        })),
        metodoEntrega: data.metodoEntrega,
        direccion: data.metodoEntrega === "envio_domicilio" ? data.direccion : undefined,
        contacto: data.contacto,
        cuponCodigo: cuponEstado?.status === "aplicado" ? cuponEstado.codigo : undefined,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setSubmitError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.error_desconocido);
      return;
    }

    clearCart();
    window.location.href = result.initPoint;
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-headline text-2xl font-extrabold uppercase tracking-wide">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-sm text-gc-blanco/60">
          Agregá productos al carrito antes de pasar por el checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <section>
          <h2 className="mb-4 font-headline text-lg font-extrabold uppercase tracking-wide">
            1. Entrega
          </h2>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gc-blanco/15 bg-gc-carbon/30 p-4">
              <input
                type="radio"
                value="retiro_punto_encuentro"
                {...register("metodoEntrega")}
                className="mt-1"
              />
              <span>
                <span className="block font-bold">Retiro en punto de encuentro</span>
                <span className="block text-sm text-gc-blanco/60">
                  {puntoEncuentroDescripcion} — sin costo
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gc-blanco/15 bg-gc-carbon/30 p-4">
              <input
                type="radio"
                value="envio_domicilio"
                {...register("metodoEntrega")}
                className="mt-1"
              />
              <span>
                <span className="block font-bold">Envío a domicilio</span>
                <span className="block text-sm text-gc-blanco/60">
                  {formatPrice(costoEnvioDomicilio)}
                </span>
              </span>
            </label>
          </div>

          {metodoEntrega === "envio_domicilio" && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="calle">Calle</Label>
                <Input id="calle" error={errors.direccion?.calle?.message} {...register("direccion.calle")} />
                <FieldError message={errors.direccion?.calle?.message} />
              </div>
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" {...register("direccion.numero")} />
              </div>
              <div>
                <Label htmlFor="pisoDepto">Piso / Depto</Label>
                <Input id="pisoDepto" {...register("direccion.pisoDepto")} />
              </div>
              <div>
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  error={errors.direccion?.ciudad?.message}
                  {...register("direccion.ciudad")}
                />
                <FieldError message={errors.direccion?.ciudad?.message} />
              </div>
              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  error={errors.direccion?.provincia?.message}
                  {...register("direccion.provincia")}
                />
                <FieldError message={errors.direccion?.provincia?.message} />
              </div>
              <div>
                <Label htmlFor="codigoPostal">Código postal</Label>
                <Input
                  id="codigoPostal"
                  error={errors.direccion?.codigoPostal?.message}
                  {...register("direccion.codigoPostal")}
                />
                <FieldError message={errors.direccion?.codigoPostal?.message} />
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-headline text-lg font-extrabold uppercase tracking-wide">
            2. Contacto
          </h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="nombre">Nombre y apellido</Label>
              <Input
                id="nombre"
                error={errors.contacto?.nombre?.message}
                {...register("contacto.nombre")}
              />
              <FieldError message={errors.contacto?.nombre?.message} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                error={errors.contacto?.email?.message}
                {...register("contacto.email")}
              />
              <FieldError message={errors.contacto?.email?.message} />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                error={errors.contacto?.telefono?.message}
                {...register("contacto.telefono")}
              />
              <FieldError message={errors.contacto?.telefono?.message} />
            </div>
          </div>
        </section>

        {submitError && <p className="text-sm text-red-400">{submitError}</p>}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Pagar con Mercado Pago
        </Button>
      </form>

      <aside className="h-fit rounded-lg border border-gc-carbon bg-gc-carbon/20 p-6">
        <h2 className="mb-4 font-headline text-sm font-extrabold uppercase tracking-wide">
          Tu pedido
        </h2>
        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="text-gc-blanco/70">
                {item.nombre} · {item.talle} × {item.cantidad}
              </span>
              <span className="shrink-0 font-stat font-bold">
                {formatPrice(item.precioUnitario * item.cantidad)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Código de cupón"
            value={cuponInput}
            onChange={(e) => setCuponInput(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={handleAplicarCupon}>
            Aplicar
          </Button>
        </div>
        {cuponEstado?.status === "aplicado" && (
          <p className="mt-2 text-xs font-bold text-gc-dorado">
            ► Cupón {cuponEstado.codigo} aplicado
          </p>
        )}
        {cuponEstado?.status === "invalido" && (
          <p className="mt-2 text-xs text-red-400">Cupón no válido.</p>
        )}

        <div className="mt-6 space-y-1 border-t border-gc-carbon pt-4 text-sm">
          <div className="flex justify-between text-gc-blanco/70">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gc-blanco/70">
            <span>Envío</span>
            <span>{costoEnvio > 0 ? formatPrice(costoEnvio) : "Sin costo"}</span>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-gc-dorado">
              <span>Descuento</span>
              <span>-{formatPrice(descuento)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 font-stat text-lg font-bold text-gc-blanco">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
