import { createAdminClient } from "@/lib/supabase/admin";

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Ventana fija respaldada por Postgres (`check_rate_limit`, ver la migración).
 * Si el RPC falla, deja pasar la request en vez de bloquear checkout por un
 * problema del propio limitador.
 */
export async function checkRateLimit(
  request: Request,
  ruta: string,
  { maxIntentos, ventanaSegundos }: { maxIntentos: number; ventanaSegundos: number }
): Promise<boolean> {
  const admin = createAdminClient();
  const clave = `${ruta}:${getClientIp(request)}`;

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_clave: clave,
    p_max_intentos: maxIntentos,
    p_ventana_segundos: ventanaSegundos,
  });

  if (error) return true;
  return data === true;
}
