import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProduct, fetchProducts, formatPrice, fromPriceLabel, getShowcase, toProduct, type ApiProduct } from "./api";

const apiProduct: ApiProduct = {
  id: "u1",
  name: "Classic Clog Infantil Rosa",
  slug: "classic-clog-infantil-rosa",
  category: "Classic",
  description: "",
  price_cents: 18990,
  stock: 3,
  active: true,
  image: "", images: [],
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

  it("galeria: todas as fotos em ordem pelo proxy, e a capa é a primeira", () => {
    const k = (n: number) => `0000000${n}-0000-4000-8000-000000000000.webp`;
    const p = toProduct({ ...apiProduct, image: `/uploads/${k(1)}`, images: [1, 2, 3].map((n) => ({ key: k(n), url: `/uploads/${k(n)}` })) });
    expect(p.images).toEqual([1, 2, 3].map((n) => `/api/uploads/${k(n)}`));
    expect(p.image).toBe(`/api/uploads/${k(1)}`);
  });

  it("descarta da galeria qualquer URL que não seja uma foto válida", () => {
    const good = "/uploads/3f2b8c1e-5d4a-4b6f-9a1c-0e7d2f8b6a31.webp";
    const p = toProduct({ ...apiProduct, images: [{ key: "x", url: "javascript:alert(1)" }, { key: "y", url: good }, { key: "z", url: "//evil.com/a.png" }] });
    expect(p.images).toEqual([`/api${good}`]);
  });

  it("com foto: usa a URL pelo proxy e o nome como texto alternativo", () => {
    const p = toProduct({ ...apiProduct, image: "/uploads/3f2b8c1e-5d4a-4b6f-9a1c-0e7d2f8b6a31.webp", images: [{ key: "3f2b8c1e-5d4a-4b6f-9a1c-0e7d2f8b6a31.webp", url: "/uploads/3f2b8c1e-5d4a-4b6f-9a1c-0e7d2f8b6a31.webp" }] });
    expect(p.image).toBe("/api/uploads/3f2b8c1e-5d4a-4b6f-9a1c-0e7d2f8b6a31.webp");
    expect(p.photo).toBe("Classic Clog Infantil Rosa");
  });

  it("sem foto: continua dizendo qual foto entra ali e não tem imagem", () => {
    const p = toProduct(apiProduct);
    expect(p.image).toBeUndefined();
    expect(p.photo).toBe("Foto: Classic Clog Infantil Rosa");
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

  it("não usa cache: a tela reflete o back em tempo real, inclusive quando ele cai", async () => {
    // Com `revalidate`, o Next segue servindo o dado velho quando o back cai, e o empty state de erro nunca aparece.
    const fn = mockFetch(() => json({ items: [] }));

    await fetchProducts();

    const init = (fn.mock.calls[0] as unknown as [string, RequestInit & { next?: unknown }])[1];
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
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

  it("API fora do ar é ERRO, nunca produto falso: a tela mostra o estado vazio de falha", async () => {
    mockFetch(() => Promise.reject(new Error("ECONNREFUSED")));
    const { items, source } = await getShowcase(8);
    expect(source).toBe("error");
    expect(items).toEqual([]);
  });

  it.each([
    ["erro 500", () => json({ code: 500, error: "erro interno" }, 500)],
    ["resposta que não é JSON", () => Promise.resolve(new Response("<html>bad gateway</html>", { status: 200 }))],
  ])("%s também é erro, sem placeholders", async (_n, impl) => {
    mockFetch(impl);
    const { items, source } = await getShowcase(8);
    expect(source).toBe("error");
    expect(items).toEqual([]);
  });
});

describe("fromPriceLabel", () => {
  const norm = (s: string | null) => s?.replace(/\s/g, " ") ?? null;

  it("usa o menor preço real do catálogo", () => {
    const items = [{ ...apiProduct, price_cents: 18990 }, { ...apiProduct, id: "u2", price_cents: 4990 }, { ...apiProduct, id: "u3", price_cents: 15990 }].map(toProduct);
    expect(norm(fromPriceLabel(items))).toBe("R$ 49,90");
  });

  it("não inventa preço: sem produtos devolve null", () => {
    expect(fromPriceLabel([])).toBeNull();
  });

  it("ignora placeholders (que não têm preço em centavos)", () => {
    const placeholder = { name: "Foto", category: "Classic" as const, price: "R$ [PREÇO]", photo: "Foto" };
    expect(fromPriceLabel([placeholder])).toBeNull();
    expect(norm(fromPriceLabel([placeholder, toProduct(apiProduct)]))).toBe("R$ 189,90");
  });
});

describe("fetchProduct", () => {
  it("200: devolve o produto", async () => {
    mockFetch(() => json(apiProduct));
    expect(await fetchProduct(apiProduct.slug)).toEqual(apiProduct);
  });

  it("404: devolve null (produto não existe ou está inativo)", async () => {
    mockFetch(() => json({ error: "not found" }, 404));
    expect(await fetchProduct("nao-existe")).toBeNull();
  });

  it("500: lança, para a página mostrar erro e não 404", async () => {
    mockFetch(() => json({ error: "boom" }, 500));
    await expect(fetchProduct("x")).rejects.toThrow("500");
  });

  it("falha de rede: lança", async () => {
    mockFetch(() => Promise.reject(new TypeError("fetch failed")));
    await expect(fetchProduct("x")).rejects.toThrow();
  });

  it("codifica o slug na URL (acentos, espaço e barra)", async () => {
    const fn = mockFetch(() => json(apiProduct));
    await fetchProduct("sandália a/b");
    expect(String(fn.mock.calls[0][0])).toMatch(/\/v1\/products\/sand%C3%A1lia%20a%2Fb$/);
  });

  it("não usa cache", async () => {
    const fn = mockFetch(() => json(apiProduct));
    await fetchProduct("x");
    expect(fn.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });
});
