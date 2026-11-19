import { describe, expect, it } from "vitest";
import {
  activeMenuItemId,
  apiFilterFor,
  emptyFilteredCopy,
  filterSummary,
  parseShopFilter,
  selectProducts,
  shopMenuItems,
} from "./shop-menu";

describe("shopMenuItems", () => {
  it("lista os itens na ordem esperada", () => {
    expect(shopMenuItems.map((i) => i.label)).toEqual([
      "Todos os modelos",
      "Novidades",
      "Classic",
      "Com luz",
      "Sandálias",
      "Charms",
      "Forrados",
    ]);
  });

  it("tem hrefs e grupos corretos", () => {
    const byLabel = Object.fromEntries(shopMenuItems.map((i) => [i.label, i]));
    expect(byLabel["Todos os modelos"].href).toBe("/loja");
    expect(byLabel["Novidades"].href).toBe("/loja?novidades=1");
    expect(byLabel["Classic"].href).toBe("/loja?categoria=Classic");
    expect(byLabel["Sandálias"].href).toBe("/loja?categoria=Sand%C3%A1lias");
    expect(shopMenuItems.map((i) => i.group)).toEqual([
      "geral",
      "geral",
      "categoria",
      "categoria",
      "categoria",
      "categoria",
      "categoria",
    ]);
    expect(shopMenuItems.map((i) => i.id).slice(0, 3)).toEqual(["all", "novidades", "categoria:Classic"]);
  });
});

describe("parseShopFilter", () => {
  it("lê os filtros válidos", () => {
    expect(parseShopFilter({})).toEqual({ kind: "all" });
    expect(parseShopFilter({ categoria: "Classic" })).toEqual({ kind: "categoria", categoria: "Classic" });
    expect(parseShopFilter({ categoria: "Sandálias" })).toEqual({ kind: "categoria", categoria: "Sandálias" });
    expect(parseShopFilter({ novidades: "1" })).toEqual({ kind: "novidades" });
  });

  it("novidades vence categoria", () => {
    expect(parseShopFilter({ categoria: "Classic", novidades: "1" })).toEqual({ kind: "novidades" });
  });

  it("ignora valores inválidos sem lançar", () => {
    const all = { kind: "all" };
    expect(parseShopFilter({ categoria: "Inexistente" })).toEqual(all);
    expect(parseShopFilter({ categoria: "classic" })).toEqual(all);
    expect(parseShopFilter({ novidades: "0" })).toEqual(all);
    expect(parseShopFilter({ novidades: "true" })).toEqual(all);
    expect(parseShopFilter({ categoria: [] })).toEqual(all);
  });

  it("parâmetros repetidos usam o primeiro valor válido", () => {
    expect(parseShopFilter({ categoria: ["Classic", "Charms"] })).toEqual({ kind: "categoria", categoria: "Classic" });
    expect(parseShopFilter({ categoria: ["Inexistente", "Charms"] })).toEqual({ kind: "categoria", categoria: "Charms" });
    expect(parseShopFilter({ novidades: ["0", "1"] })).toEqual({ kind: "novidades" });
  });
});

describe("activeMenuItemId", () => {
  it("marca o item ativo dentro de /loja", () => {
    expect(activeMenuItemId("/loja", { kind: "all" })).toBe("all");
    expect(activeMenuItemId("/loja", { kind: "novidades" })).toBe("novidades");
    expect(activeMenuItemId("/loja", { kind: "categoria", categoria: "Classic" })).toBe("categoria:Classic");
  });

  it("é null fora de /loja", () => {
    expect(activeMenuItemId("/", { kind: "all" })).toBeNull();
    expect(activeMenuItemId("/sacola", { kind: "novidades" })).toBeNull();
  });
});

describe("apiFilterFor", () => {
  it("envia a categoria só quando há categoria", () => {
    expect(apiFilterFor({ kind: "categoria", categoria: "Charms" })).toEqual({
      category: "Charms",
      sort: "newest",
      limit: 50,
    });
    expect(apiFilterFor({ kind: "all" })).toEqual({ sort: "newest", limit: 50 });
    expect(apiFilterFor({ kind: "novidades" })).toEqual({ sort: "newest", limit: 50 });
    expect("category" in apiFilterFor({ kind: "novidades" })).toBe(false);
  });
});

describe("selectProducts", () => {
  const products = [{ isNew: true }, { isNew: false }, {}];

  it("novidades devolve só os marcados como novos", () => {
    expect(selectProducts(products, { kind: "novidades" })).toEqual([{ isNew: true }]);
  });

  it("all e categoria devolvem tudo, na ordem, sem alterar o original", () => {
    const copy = [...products];
    expect(selectProducts(products, { kind: "all" })).toEqual(products);
    expect(selectProducts(products, { kind: "categoria", categoria: "Classic" })).toEqual(products);
    expect(products).toEqual(copy);
  });
});

describe("emptyFilteredCopy", () => {
  it("novidades", () => {
    const copy = emptyFilteredCopy({ kind: "novidades" });
    expect(copy.title).toBe("Nada novo por enquanto");
    expect(copy.text).toContain("últimos 14 dias");
  });

  it("categoria", () => {
    const copy = emptyFilteredCopy({ kind: "categoria", categoria: "Classic" });
    expect(copy.title).toBe("Nada em “Classic” por enquanto");
    expect(copy.text).toBe("Esses pares acabaram ou ainda estão chegando. Dá uma olhada nas outras coleções.");
  });
});

describe("filterSummary", () => {
  it("resume o filtro ativo", () => {
    expect(filterSummary({ kind: "all" })).toBeNull();
    expect(filterSummary({ kind: "novidades" })).toBe("Novidades");
    expect(filterSummary({ kind: "categoria", categoria: "Classic" })).toBe("Classic");
  });
});
