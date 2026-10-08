type BadgeVariant = "neutral" | "dorado" | "outline" | "success" | "danger";

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  reembolsado_parcial: "Reembolsado parcialmente",
};

const ORDER_STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  pendiente_pago: "neutral",
  pagado: "success",
  en_preparacion: "dorado",
  enviado: "dorado",
  entregado: "success",
  cancelado: "danger",
  reembolsado: "danger",
  reembolsado_parcial: "danger",
};

export function orderStatusLabel(estado: string) {
  return ORDER_STATUS_LABEL[estado] ?? estado;
}

export function orderStatusBadgeVariant(estado: string): BadgeVariant {
  return ORDER_STATUS_BADGE_VARIANT[estado] ?? "neutral";
}
