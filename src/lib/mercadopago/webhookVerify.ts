import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
  SignatureFailureReason,
} from "mercadopago";

export { InvalidWebhookSignatureError };

const TOLERANCIA_SEGUNDOS = 300;

export function verifyWebhookSignature(request: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("Mercado Pago no configurado: falta la variable de entorno MP_WEBHOOK_SECRET");
  }
  // Sin `toleranceSeconds`: el SDK (3.2.1) compara el `ts` contra Date.now()
  // como si fuera milisegundos, pero Mercado Pago lo manda en segundos
  // (ej. `ts=1791472025`), así que toda notificación fallaría con
  // TimestampOutOfTolerance. La ventana anti-replay se chequea abajo.
  WebhookSignatureValidator.validate({
    xSignature: request.xSignature,
    xRequestId: request.xRequestId,
    dataId: request.dataId,
    secret,
  });

  // validate() ya garantizó que el header trae un `ts` numérico.
  const ts = Number(/(?:^|,)\s*ts=(\d+)/.exec(request.xSignature!)![1]);
  if (Math.abs(Date.now() / 1000 - ts) > TOLERANCIA_SEGUNDOS) {
    throw new InvalidWebhookSignatureError(
      SignatureFailureReason.TimestampOutOfTolerance,
      request.xRequestId ?? undefined,
      String(ts)
    );
  }
}
