import { apiRequest } from "./admin";
import type { ApiOrder } from "./api";

export type OrderStatus = "new" | "paid" | "shipped" | "delivered";

const statusLabels = new Map<string, string>([
  ["new", "Recebido"],
  ["paid", "Pagamento confirmado"],
  ["shipped", "Enviado"],
  ["delivered", "Entregue"],
  ["cancelled", "Cancelado"],
]);

export const orderSteps: readonly { status: OrderStatus; label: string }[] = [
  { status: "new", label: "Recebido" },
  { status: "paid", label: "Pagamento confirmado" },
  { status: "shipped", label: "Enviado" },
  { status: "delivered", label: "Entregue" },
];

/** Código do pedido: "TK" + 8 caracteres sem 0, O, I, L, 1 (evita confusão de leitura). */
export const ORDER_CODE_PATTERN = /^TK[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;

export function orderStatusLabel(status: string): string {
  return statusLabels.get(status) ?? "Status em atualização";
}

export function orderProgress(status: string): number {
  return orderSteps.findIndex((s) => s.status === status);
}

export function normalizeOrderCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidOrderCode(code: string): boolean {
  return ORDER_CODE_PATTERN.test(code);
}

export function parseCodeParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return normalizeOrderCode(first ?? "");
}

export async function lookupOrder(code: string, phone: string): Promise<ApiOrder> {
  const normalized = normalizeOrderCode(code);
  if (!isValidOrderCode(normalized)) {
    throw new Error("Código inválido");
  }
  return apiRequest<ApiOrder>("POST", "/v1/orders/lookup", { code: normalized, phone });
}
