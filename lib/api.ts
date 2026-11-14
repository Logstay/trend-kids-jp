import type { Category, Product } from "./catalog";
import { imageSrc } from "./media";

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
  /** URL da foto servida pela API (ex.: /uploads/xxx.webp); vazio = sem foto. */
  image: string;
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
  const image = imageSrc(p.image);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    stock: p.stock,
    priceCents: p.price_cents,
    category: p.category,
    price: formatPrice(p.price_cents),
    isNew: ageDays <= NEW_DAYS,
    image,
    // Com foto, o nome vira o texto alternativo. Sem foto, o bloco diz o que deve ser fotografado (nunca imagem de IA).
    photo: image ? p.name : `Foto: ${p.name}`,
  };
}

export async function fetchProducts(filter: ProductFilter = {}): Promise<ApiProduct[]> {
  const url = new URL(`${API_URL}/v1/products`);
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  // Sem cache: com `revalidate` o Next continua servindo o dado velho quando o back cai e o empty state de erro nunca aparece.
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  const body = (await res.json()) as { items: ApiProduct[] };
  return body.items;
}

/** "R$ 49,90" do produto mais barato, ou null se não houver preço real (placeholders não contam). */
export function fromPriceLabel(items: Product[]): string | null {
  const prices = items.map((i) => i.priceCents).filter((c): c is number => typeof c === "number" && c > 0);
  return prices.length === 0 ? null : formatPrice(Math.min(...prices));
}

export type Showcase = { items: Product[]; source: "api" | "error" };

/**
 * Vitrine da landing. API vazia => lista vazia (não inventa produto).
 * API fora do ar ou resposta inválida => `source: "error"`: a tela mostra o estado de falha,
 * nunca produtos falsos (isso esconderia que o back não respondeu).
 */
export async function getShowcase(limit: number): Promise<Showcase> {
  try {
    const items = await fetchProducts({ sort: "newest", limit });
    return { items: items.map(toProduct), source: "api" };
  } catch {
    return { items: [], source: "error" };
  }
}
