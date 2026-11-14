import { describe, expect, it } from "vitest";
import { orderMessage } from "./order-message";
import type { ApiOrder } from "./api";

const order: ApiOrder = {
  code: "TKABCD2345",
  status: "new",
  customer_name: "Maria Silva",
  neighborhood: "Manaíra",
  items: [
    { product_id: "p1", name: "Classic Clog Rosa", unit_price_cents: 18990, quantity: 2, total_cents: 37980 },
    { product_id: "p2", name: "Kit 5 Charms", unit_price_cents: 4990, quantity: 1, total_cents: 4990 },
  ],
  subtotal_cents: 42970,
  shipping_cents: 1500,
  total_cents: 44470,
  created_at: "2026-11-14T10:00:00Z",
};

const norm = (s: string) => s.replace(/ /g, " ");

describe("orderMessage", () => {
  it("traz o código, cada item com quantidade e o total", () => {
    const msg = norm(orderMessage(order));
    expect(msg).toContain("TKABCD2345");
    expect(msg).toContain("2x Classic Clog Rosa");
    expect(msg).toContain("R$ 379,80");
    expect(msg).toContain("1x Kit 5 Charms");
    expect(msg).toContain("Frete: R$ 15,00");
    expect(msg).toContain("Total: R$ 444,70");
    expect(msg).toContain("Maria Silva");
    expect(msg).toContain("Manaíra");
  });

  it("omite a linha de frete quando ele é zero", () => {
    const msg = orderMessage({ ...order, shipping_cents: 0, total_cents: 42970 });
    expect(msg).not.toMatch(/Frete/);
  });

  it("não vaza o telefone nem ids internos", () => {
    const msg = orderMessage(order);
    expect(msg).not.toMatch(/p1|p2|83999|status/i);
  });
});
