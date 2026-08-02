import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresá un email válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registroSchema = z.object({
  nombre: z.string().min(1, "Ingresá tu nombre"),
  email: z.email("Ingresá un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});
export type RegistroInput = z.infer<typeof registroSchema>;

export const recuperarPasswordSchema = z.object({
  email: z.email("Ingresá un email válido"),
});
export type RecuperarPasswordInput = z.infer<typeof recuperarPasswordSchema>;

export const perfilSchema = z.object({
  nombre: z.string().min(1, "Ingresá tu nombre"),
  apellido: z.string().optional(),
  telefono: z.string().optional(),
});
export type PerfilInput = z.infer<typeof perfilSchema>;

export const actualizarPasswordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmarPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });
export type ActualizarPasswordInput = z.infer<typeof actualizarPasswordSchema>;
