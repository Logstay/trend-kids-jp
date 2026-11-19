import { describe, expect, it } from "vitest";
import { MIN_PRODUCTS_FOR_SECTIONS, pickHeroProduct, showsCollections, showsTrending } from "./landing";

describe("limites da landing", () => {
  it("o mínimo é 4", () => expect(MIN_PRODUCTS_FOR_SECTIONS).toBe(4));
  it.each([0, 3])("com %i produtos esconde coleções e tendências", (n) => {
    expect(showsCollections(n)).toBe(false);
    expect(showsTrending(n)).toBe(false);
  });
  it.each([4, 5, 8])("com %i produtos mostra coleções e tendências", (n) => {
    expect(showsCollections(n)).toBe(true);
    expect(showsTrending(n)).toBe(true);
  });
});

describe("pickHeroProduct", () => {
  const items = [
    { id: "a", image: "/a.jpg" },
    { id: "b" },
    { id: "c", image: "" },
    { id: "d", image: "/d.jpg" },
    { id: "e", image: "/e.jpg" },
  ];

  it("ignora produtos sem foto", () => {
    expect(pickHeroProduct(items, () => 0)?.id).toBe("a");
    expect(pickHeroProduct(items, () => 0.5)?.id).toBe("d");
  });
  it("random 0.9999 devolve o último com foto", () => {
    expect(pickHeroProduct(items, () => 0.9999)?.id).toBe("e");
  });
  it("random igual a 1 não estoura o índice", () => {
    expect(pickHeroProduct(items, () => 1)?.id).toBe("e");
  });
  it("lista vazia ou só sem foto devolve null", () => {
    expect(pickHeroProduct([], () => 0)).toBeNull();
    expect(pickHeroProduct([{ id: "x" }, { id: "y", image: "" }], () => 0)).toBeNull();
  });
  it("não muta a entrada", () => {
    const copy = structuredClone(items);
    pickHeroProduct(items, () => 0.3);
    expect(items).toEqual(copy);
  });
});
