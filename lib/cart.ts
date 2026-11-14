/**
 * Sacola de compras. Funções puras e imutáveis: a UI guarda o resultado (e o salva no localStorage).
 * A sacola só guarda produto e quantidade que a pessoa quer; o preço aqui é só para exibir.
 * Quem calcula o total de verdade é o servidor, ao criar o pedido.
 */

export const MAX_QTY = 20; // por linha (o back recusa acima disso)
export const MAX_LINES = 20; // produtos diferentes por pedido

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  /** Estoque conhecido quando a pessoa adicionou. O servidor confere de novo ao fechar o pedido. */
  stock: number;
};

export type CartItem = CartProduct & { qty: number };
export type Cart = { readonly items: readonly CartItem[] };

export const emptyCart: Cart = { items: [] };

function limitFor(item: CartProduct): number {
  return Math.max(0, Math.min(MAX_QTY, item.stock));
}

/** Ainda cabe mais uma unidade deste produto? */
export function canAdd(cart: Cart, product: CartProduct): boolean {
  const line = cart.items.find((i) => i.id === product.id);
  if (!line) return limitFor(product) >= 1 && cart.items.length < MAX_LINES;
  return line.qty < limitFor(product);
}

export function addItem(cart: Cart, product: CartProduct, qty = 1): Cart {
  if (!canAdd(cart, product)) {
    // mesmo sem poder somar, guarda o estoque mais recente que a vitrine informou
    const known = cart.items.find((i) => i.id === product.id);
    if (known && known.stock !== product.stock) {
      return { items: cart.items.map((i) => (i.id === product.id ? { ...i, stock: product.stock } : i)) };
    }
    return cart;
  }

  const limit = limitFor(product);
  const exists = cart.items.some((i) => i.id === product.id);
  if (!exists) return { items: [...cart.items, { ...product, qty: Math.min(qty, limit) }] };

  return {
    items: cart.items.map((i) =>
      i.id === product.id ? { ...i, stock: product.stock, priceCents: product.priceCents, name: product.name, qty: Math.min(i.qty + qty, limit) } : i,
    ),
  };
}

export function setQty(cart: Cart, id: string, qty: number): Cart {
  if (!Number.isInteger(qty)) return cart;
  const line = cart.items.find((i) => i.id === id);
  if (!line) return cart;
  if (qty <= 0) return removeItem(cart, id);
  return { items: cart.items.map((i) => (i.id === id ? { ...i, qty: Math.min(qty, limitFor(i)) } : i)) };
}

export function removeItem(cart: Cart, id: string): Cart {
  if (!cart.items.some((i) => i.id === id)) return cart;
  return { items: cart.items.filter((i) => i.id !== id) };
}

export const cartCount = (cart: Cart): number => cart.items.reduce((n, i) => n + i.qty, 0);
export const subtotalCents = (cart: Cart): number => cart.items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);

export const serializeCart = (cart: Cart): string => JSON.stringify(cart);

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isInt = (v: unknown, min: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min;

/**
 * Lê a sacola salva. O localStorage pode estar vazio, corrompido ou adulterado: nunca lança,
 * descarta o que não for válido e recorta quantidades ao limite.
 */
export function parseCart(raw: string | null): Cart {
  if (!raw) return emptyCart;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyCart;
  }
  const list = (data as { items?: unknown } | null)?.items;
  if (!Array.isArray(list)) return emptyCart;

  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const entry of list) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (!isStr(e.id) || !isStr(e.slug) || !isStr(e.name)) continue;
    if (!isInt(e.priceCents, 1) || !isInt(e.stock, 0) || !isInt(e.qty, 1)) continue;
    if (seen.has(e.id) || items.length >= MAX_LINES) continue;
    const limit = limitFor({ stock: e.stock } as CartProduct);
    if (limit < 1) continue;
    seen.add(e.id);
    items.push({ id: e.id, slug: e.slug, name: e.name, priceCents: e.priceCents, stock: e.stock, qty: Math.min(e.qty, limit) });
  }
  return { items };
}

export type Customer = { name: string; phone: string; neighborhood: string };

/** Corpo do POST /v1/orders: só produto e quantidade. Preço nunca vai (o servidor usa o do catálogo). */
export function toOrderRequest(cart: Cart, customer: Customer) {
  return {
    customer: { name: customer.name.trim(), phone: customer.phone.trim(), neighborhood: customer.neighborhood.trim() },
    items: cart.items.map((i) => ({ product_id: i.id, quantity: i.qty })),
  };
}
