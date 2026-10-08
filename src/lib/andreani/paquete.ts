// Bulto único de tamaño fijo: esta tienda solo vende indumentaria (remeras,
// shorts, conjuntos), que no varía significativamente en peso/volumen de
// envío. Capturar peso/dimensiones reales por variante sería alcance
// especulativo más allá de lo que pide esta fase — ver la decisión "Hardcode
// a fixed default parcel" en ECOMMERCE_ROADMAP.md, Phase 7.
const BULTO_DEFAULT = {
  kilos: 0.4,
  largoCm: 35,
  anchoCm: 25,
  altoCm: 5,
};

// El cotizador (`GET /v1/tarifas`) y crear-orden (`POST /v2/ordenes-de-envio`)
// esperan nombres de campo distintos para el mismo bulto físico (confirmado
// contra los ejemplos oficiales de Andreani citados en el SDK PHP de
// referencia) — de ahí dos mappers en vez de un único objeto reusado.

export function bultoParaCotizacion(valorDeclarado: number) {
  return {
    kilos: BULTO_DEFAULT.kilos,
    valorDeclarado,
  };
}

export function bultoParaOrden(valorDeclarado: number) {
  return {
    kilos: BULTO_DEFAULT.kilos,
    largoCm: BULTO_DEFAULT.largoCm,
    anchoCm: BULTO_DEFAULT.anchoCm,
    altoCm: BULTO_DEFAULT.altoCm,
    volumenCm: BULTO_DEFAULT.largoCm * BULTO_DEFAULT.anchoCm * BULTO_DEFAULT.altoCm,
    // La tienda no trackea IVA por separado del precio de venta (`products.precio`
    // ya es el precio final) — mismo valor para ambos campos.
    valorDeclaradoSinImpuestos: valorDeclarado,
    valorDeclaradoConImpuestos: valorDeclarado,
  };
}
