import { formatPrice, type ApiOrder } from "./api";

/**
 * Texto que a pessoa envia à loja pelo WhatsApp depois de fechar o pedido.
 * Os valores vêm da resposta do servidor (preço do catálogo), não da sacola.
 * Não inclui telefone (o WhatsApp já identifica quem escreve) nem ids internos.
 */
export function orderMessage(order: ApiOrder): string {
  const lines = [
    `Olá! Fiz o pedido ${order.code} pelo site da Trend Kids JP.`,
    "",
    ...order.items.map((i) => `• ${i.quantity}x ${i.name} — ${formatPrice(i.total_cents)}`),
    "",
    `Subtotal: ${formatPrice(order.subtotal_cents)}`,
  ];
  if (order.shipping_cents > 0) lines.push(`Frete: ${formatPrice(order.shipping_cents)}`);
  lines.push(`Total: ${formatPrice(order.total_cents)}`, "", `Nome: ${order.customer_name}`, `Bairro: ${order.neighborhood}`);
  return lines.join("\n");
}
