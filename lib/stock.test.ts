import { describe, expect, it } from "vitest";
import { stockLabel } from "./stock";

describe("stockLabel", () => {
  it("0 ou negativo: esgotado", () => {
    expect(stockLabel(0)).toBe("Esgotado");
    expect(stockLabel(-1)).toBe("Esgotado");
  });
  it("1 a 3: últimas unidades", () => {
    expect(stockLabel(1)).toBe("Última unidade");
    expect(stockLabel(2)).toBe("Últimas 2 unidades");
    expect(stockLabel(3)).toBe("Últimas 3 unidades");
  });
  it("4 ou mais: em estoque", () => {
    expect(stockLabel(4)).toBe("Em estoque");
    expect(stockLabel(50)).toBe("Em estoque");
  });
});
