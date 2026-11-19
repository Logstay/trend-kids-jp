import { describe, expect, it } from "vitest";
import { listView, showsCategories } from "./empty";

describe("listView", () => {
  it("lista quando há itens, mesmo com filtro ativo", () => {
    expect(listView([1], false)).toBe("list");
    expect(listView([1, 2], true)).toBe("list");
  });

  it("vazio sem filtro: a loja ainda não tem produtos", () => {
    expect(listView([], false)).toBe("empty");
  });

  it("vazio com filtro: sugere limpar o filtro, não diz que a loja está vazia", () => {
    expect(listView([], true)).toBe("empty-filtered");
  });

  it("null é falha ao carregar e vence qualquer outro estado (não é 'vazio')", () => {
    expect(listView(null, false)).toBe("error");
    expect(listView(null, true)).toBe("error");
  });
});

describe("showsCategories", () => {
  it("mostra as categorias quando há produtos para filtrar", () => {
    expect(showsCategories("list")).toBe(true);
  });

  it("mostra também no filtro sem resultado: a pessoa precisa conseguir trocar de categoria", () => {
    expect(showsCategories("empty-filtered")).toBe(true);
  });

  it("loja vazia: só o empty state, sem nomes de categoria", () => {
    expect(showsCategories("empty")).toBe(false);
  });

  it("falha ao carregar: só o estado de erro, sem nomes de categoria", () => {
    expect(showsCategories("error")).toBe(false);
  });
});
