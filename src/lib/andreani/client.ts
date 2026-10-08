// Cliente REST de Andreani. No existe un SDK oficial de Node — se llama a la
// API REST directamente con fetch, siguiendo el mismo esquema de auth/base
// URLs que expone el SDK PHP de referencia (que cita developers.andreani.com
// como fuente): login por HTTP Basic → header `x-authorization-token` en
// cada llamada posterior.
//
// Deliberadamente fail-open, igual que `getResendClient()` en
// `src/lib/email/resend.ts`: si las credenciales no están configuradas,
// `getAndreaniConfig()` devuelve `null` en vez de tirar — el checkout sigue
// funcionando con el costo de envío plano y el webhook simplemente omite la
// creación del envío (ver 7c: nunca bloquear el critical path).

const BASE_URL_SANDBOX = "https://apisqa.andreani.com";
const BASE_URL_PRODUCTION = "https://apis.andreani.com";

export type AndreaniConfig = {
  usuario: string;
  password: string;
  clienteNumero: string;
  contrato: string;
  baseUrl: string;
  origen: {
    codigoPostal: string;
    calle: string;
    numero: string;
    localidad: string;
    provincia: string;
  };
  remitente: {
    nombreCompleto: string;
    email: string;
    telefono: string;
  };
};

export function getAndreaniConfig(): AndreaniConfig | null {
  const usuario = process.env.ANDREANI_USUARIO;
  const password = process.env.ANDREANI_PASSWORD;
  const clienteNumero = process.env.ANDREANI_CLIENTE_NUMERO;
  const contrato = process.env.ANDREANI_CONTRATO;
  const codigoPostal = process.env.ANDREANI_ORIGEN_CODIGO_POSTAL;
  const calle = process.env.ANDREANI_ORIGEN_CALLE;
  const numero = process.env.ANDREANI_ORIGEN_NUMERO;
  const localidad = process.env.ANDREANI_ORIGEN_LOCALIDAD;
  const provincia = process.env.ANDREANI_ORIGEN_PROVINCIA;
  const remitenteNombre = process.env.ANDREANI_REMITENTE_NOMBRE;
  const remitenteEmail = process.env.ANDREANI_REMITENTE_EMAIL;
  const remitenteTelefono = process.env.ANDREANI_REMITENTE_TELEFONO;

  if (
    !usuario ||
    !password ||
    !clienteNumero ||
    !contrato ||
    !codigoPostal ||
    !calle ||
    !numero ||
    !localidad ||
    !provincia ||
    !remitenteNombre ||
    !remitenteEmail ||
    !remitenteTelefono
  ) {
    return null;
  }

  return {
    usuario,
    password,
    clienteNumero,
    contrato,
    baseUrl: process.env.ANDREANI_ENV === "production" ? BASE_URL_PRODUCTION : BASE_URL_SANDBOX,
    origen: { codigoPostal, calle, numero, localidad, provincia },
    remitente: { nombreCompleto: remitenteNombre, email: remitenteEmail, telefono: remitenteTelefono },
  };
}

// El token de sesión no tiene un TTL documentado públicamente — se cachea en
// memoria de proceso por una ventana corta y conservadora en vez de asumir
// una duración. En serverless (Vercel) esta caché solo sobrevive dentro de la
// misma instancia tibia; en frío simplemente se vuelve a loguear, sin efecto
// adverso más allá de un round-trip extra.
let cachedToken: { value: string; obtenidoEn: number } | null = null;
const TOKEN_TTL_MS = 10 * 60 * 1000;

export async function getAndreaniToken(config: AndreaniConfig): Promise<string> {
  if (cachedToken && Date.now() - cachedToken.obtenidoEn < TOKEN_TTL_MS) {
    return cachedToken.value;
  }

  const credenciales = Buffer.from(`${config.usuario}:${config.password}`).toString("base64");
  const res = await fetch(`${config.baseUrl}/login`, {
    method: "GET",
    headers: { Authorization: `Basic ${credenciales}` },
  });

  if (!res.ok) {
    throw new Error(`Andreani login falló con status ${res.status}`);
  }

  const token = res.headers.get("x-authorization-token");
  if (!token) {
    throw new Error("Andreani login no devolvió el header x-authorization-token");
  }

  cachedToken = { value: token, obtenidoEn: Date.now() };
  return token;
}
