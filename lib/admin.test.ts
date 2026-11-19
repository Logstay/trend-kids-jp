import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, adminRequest, centsToInput, parsePriceToCents, putBodyFrom } from "./admin";
import type { ApiProduct } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("parsePriceToCents", () => {
  it.each([
    ["189,90", 18990],
    ["189", 18900],
    ["1.234,50", 123450],
    ["R$ 49,90", 4990],
    ["10,5", 1050],
    ["189.90", 18990],
    ["1.234", 123400],
    ["  7,05 ", 705],
  ])("converte %s em %i centavos", (input, cents) => {
    expect(parsePriceToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "0", "0,00", "-5", "10,555", "1,2,3", "R$"])("recusa %j", (input) => {
    expect(parsePriceToCents(input)).toBeNull();
  });

  it("não usa ponto flutuante (19,99 não vira 1998)", () => {
    expect(parsePriceToCents("19,99")).toBe(1999);
    expect(parsePriceToCents("0,29")).toBe(29);
  });
});

describe("centsToInput", () => {
  it("formata centavos para o campo de edição", () => {
    expect(centsToInput(18990)).toBe("189,90");
    expect(centsToInput(705)).toBe("7,05");
    expect(centsToInput(4900)).toBe("49,00");
  });

  it("ida e volta preserva o valor", () => {
    for (const cents of [1, 99, 100, 18990, 123450]) {
      expect(parsePriceToCents(centsToInput(cents))).toBe(cents);
    }
  });
});

const product: ApiProduct = {
  id: "u1", name: "Classic Clog Rosa", slug: "classic-clog-rosa", category: "Classic", description: "d",
  price_cents: 18990, stock: 3, active: true, image: "", images: [], created_at: "2026-11-14T10:00:00Z",
};

describe("putBodyFrom", () => {
  it("monta o corpo completo do PUT sem estoque, id nem slug", () => {
    expect(putBodyFrom(product, { active: false })).toEqual({
      name: "Classic Clog Rosa", category: "Classic", description: "d", price_cents: 18990, active: false,
    });
  });
});

function mockFetch(res: Response | Error) {
  const fn = vi.fn(() => (res instanceof Error ? Promise.reject(res) : Promise.resolve(res)));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("adminRequest", () => {
  it("chama a API pelo proxy do próprio site, com JSON", async () => {
    const fn = mockFetch(new Response(JSON.stringify({ stock: 2 }), { status: 200 }));

    const out = await adminRequest<{ stock: number }>("PATCH", "/v1/admin/products/u1/stock", { delta: -1, reason: "venda" });

    expect(out).toEqual({ stock: 2 });
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/admin/products/u1/stock");
    expect(init.method).toBe("PATCH");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ delta: -1, reason: "venda" }));
    expect(init.credentials).toBe("same-origin");
  });

  it("devolve undefined em 204", async () => {
    mockFetch(new Response(null, { status: 204 }));
    expect(await adminRequest("POST", "/v1/admin/logout")).toBeUndefined();
  });

  it("transforma o erro da API em ApiError com status e mensagem", async () => {
    mockFetch(new Response(JSON.stringify({ code: 409, error: "estoque insuficiente" }), { status: 409 }));

    const err = await adminRequest("PATCH", "/x", {}).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.message).toBe("estoque insuficiente");
  });

  it("usa mensagem genérica quando a resposta de erro não é JSON", async () => {
    mockFetch(new Response("<html>bad gateway</html>", { status: 502 }));
    const err = await adminRequest("GET", "/x").catch((e) => e);
    expect(err.status).toBe(502);
    expect(err.message).toMatch(/tente novamente/i);
  });

  it("trata falha de rede como ApiError sem expor detalhes internos", async () => {
    mockFetch(new TypeError("fetch failed ECONNREFUSED 127.0.0.1:8080"));
    const err = await adminRequest("GET", "/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).not.toMatch(/ECONNREFUSED|127\.0\.0\.1/);
  });
});
