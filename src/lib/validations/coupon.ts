import { z } from "zod";

export const couponSchema = z.object({
  codigo: z.string().min(1, "Ingresá el código"),
  tipo: z.enum(["porcentaje", "monto_fijo"]),
  valor: z.number().positive("El valor debe ser mayor a 0"),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  usosMaximos: z.number().int().positive().optional(),
  montoMinimoCompra: z.number().nonnegative(),
  activo: z.boolean(),
});
export type CouponInput = z.infer<typeof couponSchema>;
