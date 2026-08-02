import { z } from "zod";

export const appSettingsFormSchema = z.object({
  costoEnvioDomicilio: z.number().nonnegative(),
  whatsappNumero: z.string().min(6, "Ingresá un número válido"),
  puntoEncuentroDireccion: z.string().min(1),
  puntoEncuentroDescripcion: z.string().min(1),
});
export type AppSettingsFormInput = z.infer<typeof appSettingsFormSchema>;
