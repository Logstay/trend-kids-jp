import { describe, expect, it } from "vitest";
import {
  MAX_LINES, MAX_QTY, addItem, cartCount, canAdd, emptyCart, parseCart, removeItem, serializeCart, setQty, subtotalCents,
  toOrderRequest, type Cart, type CartProduct,
} from "./cart";

const rosa: CartProduct = { id: "p-rosa", slug: "classic-clog-rosa", name: "Classic Clog Rosa", priceCents: 18990, stock: 5 };
const charms: CartProduct = { id: "p-charms", slug: "kit-5-charms", name: "Kit 5 Charms", priceCents: 4990, stock: 1 };

describe("addItem", () => {
  it("adiciona produto novo com quantidade 1", () => {
    const cart = addItem(emptyCart, rosa);
    expect(cart.items).toEqual([{ ...rosa, qty: 1 }]);
  });

  it("soma ao item que já está na sacola, sem criar linha duplicada", () => {
    const cart = addItem(addItem(emptyCart, rosa), rosa);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].qty).toBe(2);
  });

  it("nunca passa do estoque conhecido", () => {
    let cart = addItem(emptyCart, charms); // estoque 1
    cart = addItem(cart, charms);
    expect(cart.items[0].qty).toBe(1);
  });

  it("nunca passa do máximo por linha, mesmo com estoque sobrando", () => {
    let cart: Cart = emptyCart;
    for (let i = 0; i < MAX_QTY + 5; i++) cart = addItem(cart, { ...rosa, stock: 999 });
    expect(cart.items[0].qty).toBe(MAX_QTY);
  });

  it("produto sem estoque não entra", () => {
    expect(addItem(emptyCart, { ...rosa, stock: 0 })).toBe(emptyCart);
  });

  it("limita o número de produtos diferentes", () => {
    let cart: Cart = emptyCart;
    for (let i = 0; i < MAX_LINES + 3; i++) cart = addItem(cart, { ...rosa, id: `p${i}`, slug: `s${i}` });
    expect(cart.items).toHaveLength(MAX_LINES);
  });

  it("atualiza o estoque conhecido quando o produto já estava na sacola", () => {
    const cart = addItem(addItem(emptyCart, rosa), { ...rosa, stock: 2 });
    expect(cart.items[0].stock).toBe(2);
  });

  it("não altera a sacola original (imutável)", () => {
    const before = addItem(emptyCart, rosa);
    addItem(before, rosa);
    expect(before.items[0].qty).toBe(1);
  });
});

describe("canAdd", () => {
  it("diz se ainda cabe mais uma unidade", () => {
    expect(canAdd(emptyCart, rosa)).toBe(true);
    expect(canAdd(emptyCart, { ...rosa, stock: 0 })).toBe(false);
    expect(canAdd(addItem(emptyCart, charms), charms)).toBe(false);
  });
});

describe("setQty / removeItem", () => {
  const base = addItem(addItem(emptyCart, rosa), charms);

  it("troca a quantidade respeitando o estoque", () => {
    expect(setQty(base, rosa.id, 3).items[0].qty).toBe(3);
    expect(setQty(base, rosa.id, 50).items[0].qty).toBe(5);
  });

  it("quantidade zero ou negativa remove a linha", () => {
    expect(setQty(base, rosa.id, 0).items.map((i) => i.id)).toEqual([charms.id]);
    expect(setQty(base, rosa.id, -2).items.map((i) => i.id)).toEqual([charms.id]);
  });

  it("quantidade quebrada (1.5, NaN) é ignorada, não vira lixo", () => {
    expect(setQty(base, rosa.id, 1.5)).toBe(base);
    expect(setQty(base, rosa.id, NaN)).toBe(base);
  });

  it("id desconhecido não muda nada", () => {
    expect(setQty(base, "nao-existe", 2)).toBe(base);
    expect(removeItem(base, "nao-existe")).toBe(base);
  });

  it("removeItem tira só a linha pedida", () => {
    expect(removeItem(base, rosa.id).items.map((i) => i.id)).toEqual([charms.id]);
  });
});

describe("totais", () => {
  it("conta unidades e soma em centavos inteiros", () => {
    const cart = setQty(addItem(addItem(emptyCart, rosa), charms), rosa.id, 2);
    expect(cartCount(cart)).toBe(3);
    expect(subtotalCents(cart)).toBe(2 * 18990 + 4990);
    expect(cartCount(emptyCart)).toBe(0);
    expect(subtotalCents(emptyCart)).toBe(0);
  });
});

describe("parseCart / serializeCart", () => {
  it("ida e volta preserva a sacola", () => {
    const cart = setQty(addItem(addItem(emptyCart, rosa), charms), rosa.id, 3);
    expect(parseCart(serializeCart(cart))).toEqual(cart);
  });

  it.each([null, "", "{", "null", "[]", '{"items":"x"}', "123", '"texto"'])("dado corrompido %j vira sacola vazia", (raw) => {
    expect(parseCart(raw)).toEqual(emptyCart);
  });

  it("descarta itens inválidos mas mantém os bons", () => {
    const raw = JSON.stringify({
      items: [
        { ...rosa, qty: 2 },
        { ...rosa, id: "", qty: 1 },
        { ...rosa, id: "neg", qty: -1 },
        { ...rosa, id: "dec", qty: 1.5 },
        { ...rosa, id: "preco", priceCents: -5, qty: 1 },
        { id: "faltando", qty: 1 },
        "lixo",
        null,
      ],
    });
    expect(parseCart(raw).items.map((i) => i.id)).toEqual([rosa.id]);
  });

  it("recorta quantidade acima do limite e remove duplicados", () => {
    const raw = JSON.stringify({ items: [{ ...rosa, qty: 999 }, { ...rosa, qty: 1 }] });
    const cart = parseCart(raw);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].qty).toBeLessThanOrEqual(Math.min(MAX_QTY, rosa.stock));
  });
});

describe("toOrderRequest", () => {
  it("monta o pedido só com produto e quantidade: preço nunca vai", () => {
    const cart = setQty(addItem(addItem(emptyCart, rosa), charms), rosa.id, 2);

    const req = toOrderRequest(cart, { name: " Maria Silva ", phone: "(83) 99999-1234", neighborhood: " Manaíra " });

    expect(req).toEqual({
      customer: { name: "Maria Silva", phone: "(83) 99999-1234", neighborhood: "Manaíra" },
      items: [{ product_id: "p-rosa", quantity: 2 }, { product_id: "p-charms", quantity: 1 }],
    });
    expect(JSON.stringify(req)).not.toMatch(/price|18990|4990/i);
  });
});
