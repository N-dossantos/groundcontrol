import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente anon sin cookies. Usar para lecturas públicas (catálogo,
 * app_settings) desde páginas SSG/ISR: el cliente de server.ts llama a
 * cookies(), lo que fuerza renderizado dinámico en toda la ruta.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
