import { describe, expect, it } from "vitest";
import { formatPhone } from "./phone-mask";

describe("formatPhone", () => {
  it("vazio continua vazio", () => {
    expect(formatPhone("")).toBe("");
  });

  it("vai montando o DDD conforme a pessoa digita", () => {
    expect(formatPhone("8")).toBe("(8");
    expect(formatPhone("83")).toBe("(83");
    expect(formatPhone("839")).toBe("(83) 9");
    expect(formatPhone("83999")).toBe("(83) 999");
  });

  it("celular com 11 dígitos: (DDD) 9XXXX-XXXX", () => {
    expect(formatPhone("83999991234")).toBe("(83) 99999-1234");
  });

  it("fixo com 10 dígitos: (DDD) XXXX-XXXX", () => {
    expect(formatPhone("8332221234")).toBe("(83) 3222-1234");
  });

  it("aceita o texto já formatado (ignora parênteses, espaços e traço)", () => {
    expect(formatPhone("(83) 99999-1234")).toBe("(83) 99999-1234");
  });

  it("corta em 11 dígitos", () => {
    expect(formatPhone("839999912345678")).toBe("(83) 99999-1234");
  });

  it("tira o 55 do Brasil colado com +55", () => {
    expect(formatPhone("+55 83 99999-1234")).toBe("(83) 99999-1234");
    expect(formatPhone("5583999991234")).toBe("(83) 99999-1234");
  });

  it("apagar até o DDD não quebra", () => {
    expect(formatPhone("(83) ")).toBe("(83");
    expect(formatPhone("(83")).toBe("(83");
    expect(formatPhone("(")).toBe("");
  });
});
