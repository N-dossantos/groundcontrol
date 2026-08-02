import { MercadoPagoConfig } from "mercadopago";

let config: MercadoPagoConfig | null = null;

export function getMercadoPagoConfig() {
  if (!config) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Mercado Pago no configurado: falta la variable de entorno MP_ACCESS_TOKEN");
    }
    config = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10000 },
    });
  }
  return config;
}
