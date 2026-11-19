import { describe, expect, it } from "vitest";
import { DRAG_THRESHOLD_PX, activeIndex, canScroll, isDragClick, reachableCount } from "./carousel";

describe("activeIndex", () => {
  it("0 no começo", () => expect(activeIndex(0, 320, 24, 5)).toBe(0));
  it("arredonda para o card mais próximo", () => {
    expect(activeIndex(100, 320, 24, 5)).toBe(0);
    expect(activeIndex(180, 320, 24, 5)).toBe(1);
    expect(activeIndex(344, 320, 24, 5)).toBe(1);
    expect(activeIndex(700, 320, 24, 5)).toBe(2);
  });
  it("limita ao intervalo [0, count-1]", () => {
    expect(activeIndex(-50, 320, 24, 5)).toBe(0);
    expect(activeIndex(99999, 320, 24, 5)).toBe(4);
  });
  it("é seguro com count 0/1 e larguras inválidas", () => {
    expect(activeIndex(500, 320, 24, 0)).toBe(0);
    expect(activeIndex(500, 320, 24, 1)).toBe(0);
    expect(activeIndex(500, 0, 0, 5)).toBe(0);
    expect(activeIndex(Number.NaN, 320, 24, 5)).toBe(0);
  });
});

describe("canScroll", () => {
  it("no começo só dá para avançar", () => expect(canScroll(0, 600, 1200)).toEqual({ prev: false, next: true }));
  it("no meio dá para os dois lados", () => expect(canScroll(300, 600, 1200)).toEqual({ prev: true, next: true }));
  it("no fim só dá para voltar", () => expect(canScroll(600, 600, 1200)).toEqual({ prev: true, next: false }));
  it("tolera pixels fracionários", () => {
    expect(canScroll(599.4, 600, 1200)).toEqual({ prev: true, next: false });
    expect(canScroll(0.6, 600, 1200)).toEqual({ prev: false, next: true });
  });
  it("tudo cabe: as duas desabilitadas", () => {
    expect(canScroll(0, 600, 600)).toEqual({ prev: false, next: false });
    expect(canScroll(0, 600, 600.8)).toEqual({ prev: false, next: false });
  });
});

describe("isDragClick", () => {
  it("o limiar padrão é 6", () => expect(DRAG_THRESHOLD_PX).toBe(6));
  it("movimento pequeno ainda é clique", () => {
    expect(isDragClick(0)).toBe(false);
    expect(isDragClick(5)).toBe(false);
    expect(isDragClick(-5)).toBe(false);
  });
  it("a partir do limiar é arrasto, nos dois sentidos", () => {
    expect(isDragClick(6)).toBe(true);
    expect(isDragClick(-12)).toBe(true);
  });
  it("aceita limiar customizado", () => expect(isDragClick(8, 10)).toBe(false));
});

describe("reachableCount", () => {
  it("max 604 com passo 344: posições 0, 344, 604 => 3 pontos", () => {
    expect(reachableCount(1604, 1000, 320, 24, 5)).toBe(3);
  });
  it("max 696 com passo 344: 0, 344, 688, 696 clampa => 4 pontos", () => {
    expect(reachableCount(1696, 1000, 320, 24, 5)).toBe(4);
  });
  it("max exato em múltiplo de passo não cria ponto extra", () => {
    expect(reachableCount(1000 + 688, 1000, 320, 24, 5)).toBe(3);
  });
  it("tolera fração de pixel", () => expect(reachableCount(1688.9, 1000, 320, 24, 5)).toBe(3));
  it("tudo cabe: 1", () => expect(reachableCount(600, 600, 320, 24, 5)).toBe(1));
  it("nunca passa de count", () => expect(reachableCount(99999, 100, 320, 24, 3)).toBe(3));
  it("medidas inválidas: 1 (ou count se menor)", () => {
    expect(reachableCount(1696, 1000, 0, 0, 5)).toBe(1);
    expect(reachableCount(1696, 1000, 320, 24, 0)).toBe(0);
  });
});
