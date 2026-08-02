import { createAdminClient } from "@/lib/supabase/admin";

export async function getOrderByConfirmationToken(orderNumber: string, token: string) {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .eq("confirmation_token", token)
    .single();

  if (error || !order) return null;
  return order;
}
