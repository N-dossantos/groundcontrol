import { sendEmail } from "@/lib/email/resend";
import { abandonedCartEmail } from "@/lib/email/templates/abandonedCart";
import { getUserEmail } from "@/lib/email/orders";
import type { CartItem } from "@/lib/cart/store";

export async function sendAbandonedCartEmail(userId: string, items: CartItem[]) {
  const destinatario = await getUserEmail(userId);
  if (!destinatario) return false;

  const { subject, html } = abandonedCartEmail(items);
  return sendEmail({ to: destinatario, subject, html });
}
