import { featured, type Category, type Product } from "./catalog";

/** URL base do back (Go). Em produção, defina NEXT_PUBLIC_API_URL. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

/** Produto como a API devolve (dinheiro em centavos). */
export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  description: string;
  price_cents: number;
  stock: number;
  active: boolean;
  created_at: string;
};

/** Pedido como a API devolve (POST /v1/orders). Dinheiro em centavos; sem telefone. */
export type ApiOrder = {
  code: string;
  status: string;
  customer_name: string;
  neighborhood: string;
  items: { product_id: string; name: string; unit_price_cents: number; quantity: number; total_cents: number }[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  created_at: string;
};

export type ProductFilter = {
  category?: string;
  q?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
};

const NEW_DAYS = 14;

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function toProduct(p: ApiProduct): Product {
  const ageDays = (Date.now() - new Date(p.created_at).getTime()) / 86_400_000;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    stock: p.stock,
    priceCents: p.price_cents,
    category: p.category,
    price: formatPrice(p.price_cents),
    isNew: ageDays <= NEW_DAYS,
    // Sem foto real ainda: o bloco diz o que deve ser fotografado (regra D9, nunca imagem de IA).
    photo: `Foto: ${p.name}`,
  };
}

export async function fetchProducts(filter: ProductFilter = {}): Promise<ApiProduct[]> {
  const url = new URL(`${API_URL}/v1/products`);
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  const body = (await res.json()) as { items: ApiProduct[] };
  return body.items;
}

export type Showcase = { items: Product[]; source: "api" | "fallback" };

/**
 * Vitrine da landing. API vazia => lista vazia (não inventa produto).
 * API fora do ar => placeholders, para a landing nunca quebrar.
 */
export async function getShowcase(limit: number): Promise<Showcase> {
  try {
    const items = await fetchProducts({ sort: "newest", limit });
    return { items: items.map(toProduct), source: "api" };
  } catch {
    return { items: featured, source: "fallback" };
  }
}
