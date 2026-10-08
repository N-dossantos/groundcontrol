import { createAdminClient } from "@/lib/supabase/admin";
import { getUserEmail } from "@/lib/email/orders";
import { getAndreaniConfig, getAndreaniToken } from "./client";
import { bultoParaOrden } from "./paquete";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

type DireccionSnapshot = {
  calle?: string;
  numero?: string;
  pisoDepto?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
};

// NOTA: el ejemplo oficial de Andreani para crear una orden incluye
// `documentoTipo`/`documentoNumero` (DNI) en remitente y destinatario. Esta
// tienda no pide DNI/CUIT en el checkout hoy, así que se omiten — si el
// sandbox real de Andreani los exige, este es el primer lugar a revisar
// (el fetch de abajo falla explícitamente con el status de Andreani en ese
// caso, no en silencio).
async function resolveDestinatario(order: Order) {
  if (order.user_id) {
    const admin = createAdminClient();
    const [{ data: profile }, email] = await Promise.all([
      admin.from("profiles").select("nombre, apellido, telefono").eq("id", order.user_id).single(),
      getUserEmail(order.user_id),
    ]);

    return {
      nombreCompleto: [profile?.nombre, profile?.apellido].filter(Boolean).join(" ") || "Cliente",
      email: email ?? "",
      telefonos: profile?.telefono ? [{ tipo: 1, numero: profile.telefono }] : [],
    };
  }

  return {
    nombreCompleto: order.guest_nombre ?? "Cliente",
    email: order.guest_email ?? "",
    telefonos: order.guest_phone ? [{ tipo: 1, numero: order.guest_phone }] : [],
  };
}

// POST /v2/ordenes-de-envio — endpoint, base URLs y shape del body
// confirmados contra el ejemplo oficial (`addOrden.php`, citando
// developers.andreani.com/documentacion/2#crearOrden) del SDK PHP de
// referencia de Andreani. Nunca bloquea el critical path del webhook: toda
// falla se loguea y devuelve `null`, dejando `andreani_numero_envio` en null
// como señal de "no creado todavía" (recuperable por reintento del webhook o
// por el escape hatch manual del admin).
export async function crearEnvioAndreani(order: Order): Promise<{ numeroEnvio: string } | null> {
  const config = getAndreaniConfig();
  if (!config) {
    console.warn(
      `[andreani] no configurado — se omite creación de envío para el pedido ${order.order_number}`
    );
    return null;
  }

  const direccion = order.direccion_envio as DireccionSnapshot | null;
  if (!direccion?.codigoPostal) {
    console.error(`[andreani] pedido ${order.order_number} no tiene una dirección de envío válida`);
    return null;
  }

  try {
    const token = await getAndreaniToken(config);
    const destinatario = await resolveDestinatario(order);

    const body = {
      contrato: config.contrato,
      origen: {
        postal: {
          codigoPostal: config.origen.codigoPostal,
          calle: config.origen.calle,
          numero: config.origen.numero,
          localidad: config.origen.localidad,
          region: config.origen.provincia,
          pais: "Argentina",
        },
      },
      destino: {
        postal: {
          codigoPostal: direccion.codigoPostal,
          calle: direccion.calle,
          numero: direccion.numero,
          localidad: direccion.ciudad,
          region: direccion.provincia,
          pais: "Argentina",
        },
      },
      remitente: {
        nombreCompleto: config.remitente.nombreCompleto,
        email: config.remitente.email,
        telefonos: [{ tipo: 1, numero: config.remitente.telefono }],
      },
      destinatario: [destinatario],
      productoAEntregar: "Indumentaria deportiva",
      bultos: [bultoParaOrden(order.subtotal)],
    };

    const res = await fetch(`${config.baseUrl}/v2/ordenes-de-envio`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-authorization-token": token },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(
        `[andreani] error creando envío para el pedido ${order.order_number}: status ${res.status}`
      );
      return null;
    }

    const data = await res.json();
    const numeroEnvio = data?.bultos?.[0]?.numeroDeEnvio;
    if (numeroEnvio === undefined || numeroEnvio === null) {
      console.error(
        `[andreani] respuesta de creación de envío sin bultos[0].numeroDeEnvio para ${order.order_number}`
      );
      return null;
    }

    return { numeroEnvio: String(numeroEnvio) };
  } catch (err) {
    console.error(`[andreani] error creando envío para el pedido ${order.order_number}`, err);
    return null;
  }
}

export type EventoTrazabilidad = { fecha: string; estado: string; comentario?: string };

// GET /v1/envios/{numero}/trazas. El shape exacto de la respuesta no se pudo
// confirmar en esta sesión (ver ECOMMERCE_ROADMAP.md) — se parsean varios
// nombres de campo plausibles (`eventos[].{fecha,estado,comentario}`,
// evidenciados en documentación pública de un producto Andreani relacionado)
// y se loguea si la forma real no matchea, en vez de fallar en silencio.
export async function consultarTrazabilidad(numeroEnvio: string): Promise<EventoTrazabilidad[] | null> {
  const config = getAndreaniConfig();
  if (!config) return null;

  try {
    const token = await getAndreaniToken(config);
    const res = await fetch(`${config.baseUrl}/v1/envios/${numeroEnvio}/trazas`, {
      headers: { "x-authorization-token": token },
    });

    // Un envío recién creado responde 404 hasta que Andreani lo retira del origen — no es un error.
    if (res.status === 404) return [];

    if (!res.ok) {
      console.error(`[andreani] trazabilidad respondió status ${res.status} para el envío ${numeroEnvio}`);
      return null;
    }

    const data = await res.json();
    const eventosRaw: unknown[] | null = Array.isArray(data?.eventos)
      ? data.eventos
      : Array.isArray(data)
        ? data
        : null;

    if (!eventosRaw) {
      console.error(
        `[andreani] respuesta de trazabilidad sin un array de eventos reconocible para ${numeroEnvio}`
      );
      return null;
    }

    return eventosRaw
      .map((evento) => {
        const e = evento as Record<string, unknown>;
        return {
          fecha: String(e.fecha ?? e.fechaEvento ?? ""),
          estado: String(e.estado ?? e.descripcion ?? "Actualización"),
          comentario: typeof e.comentario === "string" ? e.comentario : undefined,
        };
      })
      .filter((evento) => evento.fecha);
  } catch (err) {
    console.error(`[andreani] error consultando trazabilidad del envío ${numeroEnvio}`, err);
    return null;
  }
}
