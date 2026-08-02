import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente con la service_role key: sortea RLS por completo.
 * SOLO para uso server-side en rutas de confianza (webhook de MP, reembolso
 * admin, cron de liberación de reservas, creación de preferencia de checkout).
 * Nunca importar desde un Client Component ni exponer esta key al navegador.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
