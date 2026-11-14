import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProducts, formatPrice, getShowcase, toProduct, type ApiProduct } from "./api";

const apiProduct: ApiProduct = {
  id: "u1",
  name: "Classic Clog Infantil Rosa",
  slug: "classic-clog-infantil-rosa",
  category: "Classic",
  description: "",
  price_cents: 18990,
  stock: 3,
  active: true,
  created_at: new Date().toISOString(),
};

function mockFetch(impl: () => Promise<Response>) {
  const fn = vi.fn((..._args: unknown[]) => impl());
  vi.stubGlobal("fetch", fn);
  return fn;
}

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("formatPrice", () => {
  it("formata centavos em reais no padrão brasileiro", () => {
    expect(formatPrice(18990).replace(/\s/g, " ")).toBe("R$ 189,90");
    expect(formatPrice(4990).replace(/\s/g, " ")).toBe("R$ 49,90");
  });
});

describe("toProduct", () => {
  it("converte o produto da API para o formato da vitrine", () => {
    const p = toProduct(apiProduct);
    expect(p.name).toBe("Classic Clog Infantil Rosa");
    expect(p.slug).toBe("classic-clog-infantil-rosa");
    expect(p.price.replace(/\s/g, " ")).toBe("R$ 189,90");
    expect(p.photo).toBe("Foto: Classic Clog Infantil Rosa");
  });

  it("carrega id, estoque e preço em centavos para a sacola", () => {
    const p = toProduct(apiProduct);
    expect(p.id).toBe("u1");
    expect(p.stock).toBe(3);
    expect(p.priceCents).toBe(18990);
  });

  it("marca como novidade só produto criado nos últimos 14 dias", () => {
    const old = new Date(Date.now() - 30 * 86_400_000).toISOString();
    expect(toProduct(apiProduct).isNew).toBe(true);
    expect(toProduct({ ...apiProduct, created_at: old }).isNew).toBe(false);
  });
});

describe("fetchProducts", () => {
  it("monta a query só com os filtros informados", async () => {
    const fn = mockFetch(() => json({ items: [] }));

    await fetchProducts({ category: "Com luz", limit: 5 });

    const url = new URL(String(fn.mock.calls[0][0]));
    expect(url.pathname).toBe("/v1/products");
    expect(url.searchParams.get("category")).toBe("Com luz");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.has("q")).toBe(false);
  });

  it("devolve os itens da API", async () => {
    mockFetch(() => json({ items: [apiProduct] }));
    expect(await fetchProducts()).toHaveLength(1);
  });

  it("lança erro quando a API responde com falha", async () => {
    mockFetch(() => json({ code: 500, error: "erro interno" }, 500));
    await expect(fetchProducts()).rejects.toThrow(/500/);
  });
});

describe("getShowcase", () => {
  it("usa os produtos da API quando disponível", async () => {
    mockFetch(() => json({ items: [apiProduct] }));
    const { items, source } = await getShowcase(8);
    expect(source).toBe("api");
    expect(items[0].slug).toBe("classic-clog-infantil-rosa");
  });

  it("não inventa produto quando a API responde vazia", async () => {
    mockFetch(() => json({ items: [] }));
    const { items, source } = await getShowcase(8);
    expect(source).toBe("api");
    expect(items).toEqual([]);
  });

  it("cai nos placeholders quando a API está fora do ar", async () => {
    mockFetch(() => Promise.reject(new Error("ECONNREFUSED")));
    const { items, source } = await getShowcase(8);
    expect(source).toBe("fallback");
    expect(items.length).toBeGreaterThan(0);
  });
});
