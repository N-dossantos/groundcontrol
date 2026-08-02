import { z } from "zod";

export const cartItemInputSchema = z.object({
  productVariantId: z.uuid(),
  cantidad: z.number().int().min(1),
  nombreEstampado: z.string().max(20).optional(),
  numeroEstampado: z.string().max(3).optional(),
});

export const direccionSchema = z.object({
  calle: z.string().min(1, "Ingresá la calle"),
  numero: z.string().optional(),
  pisoDepto: z.string().optional(),
  ciudad: z.string().min(1, "Ingresá la ciudad"),
  provincia: z.string().min(1, "Ingresá la provincia"),
  codigoPostal: z.string().min(1, "Ingresá el código postal"),
});
export type DireccionInput = z.infer<typeof direccionSchema>;

export const addressSchema = direccionSchema.extend({
  esPredeterminada: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const contactoSchema = z.object({
  nombre: z.string().min(1, "Ingresá tu nombre"),
  email: z.email("Ingresá un email válido"),
  telefono: z.string().min(6, "Ingresá un teléfono válido"),
});
export type ContactoInput = z.infer<typeof contactoSchema>;

export const checkoutFormSchema = z
  .object({
    metodoEntrega: z.enum(["retiro_punto_encuentro", "envio_domicilio"]),
    direccion: direccionSchema.optional(),
    contacto: contactoSchema,
    cuponCodigo: z.string().optional(),
  })
  .refine((data) => data.metodoEntrega !== "envio_domicilio" || !!data.direccion, {
    message: "La dirección es obligatoria para envío a domicilio",
    path: ["direccion"],
  });
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

export const crearPreferenciaSchema = z
  .object({
    items: z.array(cartItemInputSchema).min(1, "El carrito está vacío"),
    metodoEntrega: z.enum(["retiro_punto_encuentro", "envio_domicilio"]),
    direccion: direccionSchema.optional(),
    contacto: contactoSchema,
    cuponCodigo: z.string().optional(),
  })
  .refine((data) => data.metodoEntrega !== "envio_domicilio" || !!data.direccion, {
    message: "La dirección es obligatoria para envío a domicilio",
    path: ["direccion"],
  });
export type CrearPreferenciaInput = z.infer<typeof crearPreferenciaSchema>;
