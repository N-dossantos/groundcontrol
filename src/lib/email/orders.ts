import { sendEmail } from "@/lib/email/resend";
import { orderConfirmationEmail } from "@/lib/email/templates/orderConfirmation";
import { orderStatusChangeEmail } from "@/lib/email/templates/orderStatusChange";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export async function sendOrderConfirmationEmail(order: Order) {
  const destinatario = order.guest_email ?? (await getUserEmail(order.user_id));
  if (!destinatario) return;

  const admin = createAdminClient();
  const { data: items } = await admin.from("order_items").select("*").eq("order_id", order.id);

  const { subject, html } = orderConfirmationEmail(order, items ?? []);
  await sendEmail({ to: destinatario, subject, html });
}

export async function sendOrderStatusChangeEmail(order: Order, nuevoEstado: string) {
  const destinatario = order.guest_email ?? (await getUserEmail(order.user_id));
  if (!destinatario) return;

  const email = orderStatusChangeEmail(order, nuevoEstado);
  if (!email) return;

  await sendEmail({ to: destinatario, ...email });
}

async function getUserEmail(userId: string | null) {
  if (!userId) return null;
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}
