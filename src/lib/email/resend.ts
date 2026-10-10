import { Resend } from "resend";

let client: Resend | null = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    console.warn("[email] RESEND_API_KEY no configurada — se omite el envío");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS ?? "pedidos@groundcontrol90.com",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[email] Resend rechazó el envío:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Falló el envío:", error);
    return false;
  }
}
