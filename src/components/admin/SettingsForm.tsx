"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  appSettingsFormSchema,
  type AppSettingsFormInput,
} from "@/lib/validations/settings";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

export function SettingsForm({ initial }: { initial: AppSettingsFormInput }) {
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppSettingsFormInput>({
    resolver: zodResolver(appSettingsFormSchema),
    defaultValues: initial,
  });

  async function onSubmit(data: AppSettingsFormInput) {
    setError(null);
    setGuardado(false);
    const supabase = createClient();

    const updates = [
      { key: "costo_envio_domicilio", value: data.costoEnvioDomicilio },
      { key: "whatsapp_numero", value: data.whatsappNumero },
      { key: "punto_encuentro_direccion", value: data.puntoEncuentroDireccion },
      { key: "punto_encuentro_descripcion", value: data.puntoEncuentroDescripcion },
      { key: "cuotas_maximas", value: data.cuotasMaximas },
    ];

    const { error: upsertError } = await supabase.from("app_settings").upsert(updates);

    if (upsertError) {
      setError("No pudimos guardar la configuración.");
      return;
    }
    setGuardado(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      <div>
        <Label htmlFor="costoEnvioDomicilio">Costo de envío a domicilio (ARS)</Label>
        <Input
          id="costoEnvioDomicilio"
          type="number"
          step="1"
          error={errors.costoEnvioDomicilio?.message}
          {...register("costoEnvioDomicilio", { valueAsNumber: true })}
        />
        <FieldError message={errors.costoEnvioDomicilio?.message} />
      </div>
      <div>
        <Label htmlFor="whatsappNumero">Número de WhatsApp (con código de país)</Label>
        <Input
          id="whatsappNumero"
          error={errors.whatsappNumero?.message}
          {...register("whatsappNumero")}
        />
        <FieldError message={errors.whatsappNumero?.message} />
      </div>
      <div>
        <Label htmlFor="puntoEncuentroDireccion">Dirección del punto de encuentro</Label>
        <Input id="puntoEncuentroDireccion" {...register("puntoEncuentroDireccion")} />
      </div>
      <div>
        <Label htmlFor="puntoEncuentroDescripcion">Descripción del punto de encuentro</Label>
        <Input id="puntoEncuentroDescripcion" {...register("puntoEncuentroDescripcion")} />
      </div>
      <div>
        <Label htmlFor="cuotasMaximas">Cuotas máximas en Mercado Pago</Label>
        <Input
          id="cuotasMaximas"
          type="number"
          step="1"
          error={errors.cuotasMaximas?.message}
          {...register("cuotasMaximas", { valueAsNumber: true })}
        />
        <FieldError message={errors.cuotasMaximas?.message} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {guardado && <p className="text-sm text-gc-dorado">► Configuración guardada</p>}
      <Button type="submit" isLoading={isSubmitting}>
        Guardar
      </Button>
    </form>
  );
}
