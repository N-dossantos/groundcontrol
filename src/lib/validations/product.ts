import { z } from "zod";

export const productoSchema = z.object({
  nombre: z.string().min(1, "Ingresá el nombre"),
  slug: z.string().min(1, "Ingresá el slug"),
  tipo: z.enum(["camiseta", "short", "conjunto"]),
  club: z.string().optional(),
  liga: z.string().optional(),
  temporada: z.string().optional(),
  descripcion: z.string().optional(),
  precio: z.number().nonnegative("El precio debe ser mayor o igual a 0"),
  permite_personalizacion: z.boolean(),
  activo: z.boolean(),
  destacado: z.boolean(),
});
export type ProductoInput = z.infer<typeof productoSchema>;

export const nuevoProductoSchema = productoSchema.pick({
  nombre: true,
  tipo: true,
  club: true,
  precio: true,
  permite_personalizacion: true,
});
export type NuevoProductoInput = z.infer<typeof nuevoProductoSchema>;
