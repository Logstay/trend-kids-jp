import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings, getSettings, hasWhatsApp, normalizeSettings, whatsappHref, type StoreSettings } from "./settings";

afterEach(() => vi.unstubAllGlobals());

const configured: StoreSettings = {
  name: "Trend Kids JP",
  city: "João Pessoa · PB",
  description: "Crocs infantis",
  whatsapp: "5583999991234",
  whatsapp_display: "(83) 99999-1234",
  phone: "(83) 3222-1234",
  phone_tel: "+558332221234",
  instagram: "trendkidsjp",
  instagram_url: "https://www.instagram.com/trendkidsjp",
};

describe("normalizeSettings", () => {
  it("aceita o que a API devolve", () => {
    expect(normalizeSettings(configured)).toEqual(configured);
  });

  it.each([null, undefined, "texto", 42, [], {}])("lixo %j vira os valores padrão", (raw) => {
    expect(normalizeSettings(raw)).toEqual(defaultSettings);
  });

  it("campo com tipo errado volta ao padrão sem derrubar os outros", () => {
    const s = normalizeSettings({ ...configured, name: 123, city: null });
    expect(s.name).toBe(defaultSettings.name);
    expect(s.city).toBe(defaultSettings.city);
    expect(s.whatsapp).toBe("5583999991234");
  });

  it("descarta campos extras", () => {
    expect(Object.keys(normalizeSettings({ ...configured, segredo: "x" })).sort()).toEqual(Object.keys(defaultSettings).sort());
  });

  it("nunca deixa um valor estranho virar link: só dígitos, só instagram.com, só +55", () => {
    const s = normalizeSettings({
      ...configured,
      whatsapp: "javascript:alert(1)",
      instagram_url: "javascript:alert(1)",
      phone_tel: "tel:+55; rm",
    });
    expect(s.whatsapp).toBe("");
    expect(s.instagram_url).toBe("");
    expect(s.phone_tel).toBe("");
    expect(normalizeSettings({ ...configured, instagram_url: "https://evil.com/x" }).instagram_url).toBe("");
  });
});

describe("whatsappHref / hasWhatsApp", () => {
  it("monta o wa.me com a mensagem codificada", () => {
    const href = whatsappHref(configured, "Olá! Quero 2 pares & um kit");
    expect(href).toBe("https://wa.me/5583999991234?text=Ol%C3%A1!%20Quero%202%20pares%20%26%20um%20kit");
  });

  it("usa uma mensagem padrão quando não recebe nenhuma", () => {
    expect(whatsappHref(configured)).toContain("https://wa.me/5583999991234?text=");
  });

  it("sem WhatsApp configurado aponta para a âncora de contato, nunca para um link quebrado", () => {
    expect(whatsappHref(defaultSettings, "oi")).toBe("#contato");
    expect(hasWhatsApp(defaultSettings)).toBe(false);
    expect(hasWhatsApp(configured)).toBe(true);
  });
});

describe("getSettings", () => {
  const stub = (res: Response | Error) => {
    const fn = vi.fn(() => (res instanceof Error ? Promise.reject(res) : Promise.resolve(res)));
    vi.stubGlobal("fetch", fn);
    return fn;
  };

  it("lê da API", async () => {
    stub(new Response(JSON.stringify(configured), { status: 200 }));
    expect(await getSettings()).toEqual(configured);
  });

  it.each([
    ["API fora do ar", new Error("ECONNREFUSED")],
    ["erro 500", new Response("{}", { status: 500 })],
    ["resposta que não é JSON", new Response("<html>", { status: 200 })],
  ])("%s: cai nos valores padrão e o site continua de pé", async (_name, res) => {
    stub(res as Response | Error);
    expect(await getSettings()).toEqual(defaultSettings);
  });

  it("no painel pede dados frescos, sem cache", async () => {
    const fn = stub(new Response(JSON.stringify(configured), { status: 200 }));
    await getSettings({ fresh: true });
    const init = (fn.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.cache).toBe("no-store");
  });
});
