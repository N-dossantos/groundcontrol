import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/cart/store";

// Usado por el link del email de carrito abandonado (/carrito?recuperar=1)
// para traer el último carrito espejado en `carts` cuando el local está vacío
// (otro dispositivo, o localStorage limpiado).
export async function recoverCartFromServer(): Promise<CartItem[] | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data } = await supabase
    .from("carts")
    .select("items")
    .eq("user_id", userData.user.id)
    .single();

  if (!data || !Array.isArray(data.items) || data.items.length === 0) return null;

  return data.items as unknown as CartItem[];
}
