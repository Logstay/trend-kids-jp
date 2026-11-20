import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings, type StoreSettings } from "./settings";
import { checkoutWhatsAppHref, getSellers, normalizeAdminSellers, normalizeSellers, sellerHref, whatsappTarget, type Seller } from "./sellers";

afterEach(() => vi.unstubAllGlobals());

const ana: Seller = { id: "s1", name: "Ana Paula", whatsapp: "5583999991234", whatsapp_display: "(83) 99999-1234" };
const bia: Seller = { id: "s2", name: "Bia", whatsapp: "5583988887766", whatsapp_display: "(83) 98888-7766" };
const withContact: StoreSettings = { ...defaultSettings, whatsapp: "5583911112222", whatsapp_display: "(83) 91111-2222" };

describe("sellerHref", () => {
  it("monta o wa.me da vendedora com a mensagem codificada", () => {
    expect(sellerHref(ana, "Olá, Ana! Quero 2 pares")).toBe("https://wa.me/5583999991234?text=Ol%C3%A1%2C%20Ana!%20Quero%202%20pares");
  });
});

describe("whatsappTarget: para quem o cliente é levado", () => {
  it("2 ou mais vendedoras ativas: o cliente ESCOLHE com quem falar", () => {
    const t = whatsappTarget([ana, bia], withContact, "oi");
    expect(t.kind).toBe("choose");
    if (t.kind !== "choose") return;
    expect(t.options.map((o) => o.name)).toEqual(["Ana Paula", "Bia"]);
    expect(t.options[0].href).toBe("https://wa.me/5583999991234?text=oi");
    expect(t.options[1].display).toBe("(83) 98888-7766");
  });

  it("1 vendedora: vai direto para ela, mesmo havendo WhatsApp de contato", () => {
    const t = whatsappTarget([ana], withContact, "oi");
    expect(t).toEqual({ kind: "direct", href: "https://wa.me/5583999991234?text=oi" });
  });

  it("nenhuma vendedora: cai no WhatsApp de contato da loja", () => {
    const t = whatsappTarget([], withContact, "oi");
    expect(t).toEqual({ kind: "direct", href: "https://wa.me/5583911112222?text=oi" });
  });

  it("nenhuma vendedora e sem contato: aponta para a âncora de contato, nunca um link quebrado", () => {
    expect(whatsappTarget([], defaultSettings, "oi")).toEqual({ kind: "none", href: "#contato" });
  });

  it("o contato geral NÃO entra na lista de escolha (são coisas separadas)", () => {
    const t = whatsappTarget([ana, bia], withContact, "oi");
    expect(t.kind === "choose" && t.options.some((o) => o.href.includes("5583911112222"))).toBe(false);
  });
});

describe("normalizeSellers", () => {
  it("aceita o que a API devolve", () => {
    expect(normalizeSellers({ items: [ana, bia] })).toEqual([ana, bia]);
  });

  it.each([null, undefined, "x", 42, [], {}, { items: "x" }])("lixo %j vira lista vazia", (raw) => {
    expect(normalizeSellers(raw)).toEqual([]);
  });

  it("descarta itens inválidos e perigosos, mantendo os bons", () => {
    const raw = {
      items: [
        ana,
        { ...bia, whatsapp: "javascript:alert(1)" },
        { ...bia, id: 5 },
        { ...bia, name: "" },
        null,
        "lixo",
        { ...bia, whatsapp: "83988887766" }, // sem o 55: não é wa.me válido
      ],
    };
    expect(normalizeSellers(raw)).toEqual([ana]);
  });

  it("corta em 20, o teto do cadastro", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...ana, id: `s${i}` }));
    expect(normalizeSellers({ items: many })).toHaveLength(20);
  });
});

describe("normalizeAdminSellers", () => {
  it("mantém o estado ativo/inativo e a data", () => {
    const raw = { items: [{ ...ana, active: false, created_at: "2026-11-14T10:00:00Z" }, { ...bia, active: true, created_at: "2026-11-14T11:00:00Z" }] };
    const out = normalizeAdminSellers(raw);
    expect(out.map((s) => s.active)).toEqual([false, true]);
  });

  it("sem o campo active o item é descartado (nunca assume que está ativa)", () => {
    expect(normalizeAdminSellers({ items: [{ ...ana, created_at: "x" }] })).toEqual([]);
  });
});

describe("getSellers", () => {
  it("lê da API", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({ items: [ana] }), { status: 200 }))));
    expect(await getSellers()).toEqual([ana]);
  });

  it.each([
    ["API fora do ar", () => Promise.reject(new Error("ECONNREFUSED"))],
    ["erro 500", () => Promise.resolve(new Response("{}", { status: 500 }))],
    ["resposta que não é JSON", () => Promise.resolve(new Response("<html>", { status: 200 }))],
  ])("%s: sem vendedoras (o site cai no contato geral e continua de pé)", async (_n, impl) => {
    vi.stubGlobal("fetch", vi.fn(impl));
    expect(await getSellers()).toEqual([]);
  });
});

describe("checkoutWhatsAppHref: a vendedora escolhida no checkout", () => {
  it("usa a vendedora escolhida, mesmo havendo outra na lista", () => {
    expect(checkoutWhatsAppHref([ana, bia], withContact, "oi", bia.id)).toBe("https://wa.me/5583988887766?text=oi");
  });

  it("escolha que não existe (ou vazia) cai na primeira vendedora ativa", () => {
    expect(checkoutWhatsAppHref([ana, bia], withContact, "oi", "nao-existe")).toBe("https://wa.me/5583999991234?text=oi");
    expect(checkoutWhatsAppHref([ana, bia], withContact, "oi", "")).toBe("https://wa.me/5583999991234?text=oi");
  });

  it("sem vendedora, vai para o WhatsApp de contato da loja", () => {
    expect(checkoutWhatsAppHref([], withContact, "oi", "")).toBe("https://wa.me/5583911112222?text=oi");
  });

  it("sem nenhum WhatsApp configurado, usa a âncora de contato", () => {
    expect(checkoutWhatsAppHref([], defaultSettings, "oi", "")).toBe("#contato");
  });
});
