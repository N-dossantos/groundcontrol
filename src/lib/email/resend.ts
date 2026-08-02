import { Resend } from "resend";

let client: Resend | null = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const resend = getResendClient();

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY no configurada — se omite envío a ${params.to}: ${params.subject}`);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM_ADDRESS ?? "pedidos@groundcontrol90.com",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
