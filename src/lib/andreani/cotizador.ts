import { getAndreaniConfig, getAndreaniToken } from "./client";
import { bultoParaCotizacion } from "./paquete";

export type CotizacionEnvio = { costo: number };

// GET /v1/tarifas?cpDestino=...&contrato=...&cliente=...&bultos[0][...]=...
// Endpoint y query params confirmados contra el ejemplo oficial
// (`cotizarEnvio.php`) citado por el SDK PHP de referencia de Andreani. El
// shape exacto de la respuesta (qué campo trae el costo final) no se pudo
// confirmar en esta sesión — se prueban varios nombres plausibles y, si
// ninguno matchea, se loguea la respuesta cruda para ajustar esto contra la
// primera llamada real de sandbox.
export async function cotizarEnvio(
  codigoPostal: string,
  valorDeclarado: number
): Promise<CotizacionEnvio | null> {
  const config = getAndreaniConfig();
  if (!config) return null;

  try {
    const token = await getAndreaniToken(config);
    const bulto = bultoParaCotizacion(valorDeclarado);

    const params = new URLSearchParams({
      cpDestino: codigoPostal,
      contrato: config.contrato,
      cliente: config.clienteNumero,
      "bultos[0][kilos]": String(bulto.kilos),
      "bultos[0][valorDeclarado]": String(bulto.valorDeclarado),
    });

    const res = await fetch(`${config.baseUrl}/v1/tarifas?${params.toString()}`, {
      headers: { "x-authorization-token": token },
    });

    if (!res.ok) {
      console.error(`[andreani] cotizador respondió ${res.status} para CP ${codigoPostal}`);
      return null;
    }

    const data = await res.json();
    const costo = [data?.tarifaConIva, data?.tarifaSinIva, data?.total, data?.tarifa].find(
      (v) => typeof v === "number"
    );

    if (typeof costo !== "number") {
      console.error(
        `[andreani] respuesta de cotizador sin un campo de costo reconocido, claves: ${Object.keys(data ?? {}).join(", ")}`
      );
      return null;
    }

    return { costo };
  } catch (err) {
    console.error("[andreani] error cotizando envío", err);
    return null;
  }
}
