import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";

export { InvalidWebhookSignatureError };

export function verifyWebhookSignature(request: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Mercado Pago no configurado: falta la variable de entorno MP_WEBHOOK_SECRET");
  }
  WebhookSignatureValidator.validate({
    xSignature: request.xSignature,
    xRequestId: request.xRequestId,
    dataId: request.dataId,
    secret,
    toleranceSeconds: 300,
  });
}
