import { describe, expect, it } from "vitest";
import {
  isValidOrderCode,
  normalizeOrderCode,
  orderProgress,
  orderStatusLabel,
  orderSteps,
  parseCodeParam,
} from "./order-tracking";

describe("orderStatusLabel", () => {
  it("traduz cada status conhecido", () => {
    expect(orderStatusLabel("new")).toBe("Recebido");
    expect(orderStatusLabel("paid")).toBe("Pagamento confirmado");
    expect(orderStatusLabel("shipped")).toBe("Enviado");
    expect(orderStatusLabel("delivered")).toBe("Entregue");
    expect(orderStatusLabel("cancelled")).toBe("Cancelado");
  });

  it("usa texto neutro para status desconhecido", () => {
    expect(orderStatusLabel("xyz")).toBe("Status em atualização");
  });

  it("não confunde propriedades herdadas do objeto com status", () => {
    expect(orderStatusLabel("constructor")).toBe("Status em atualização");
    expect(orderStatusLabel("toString")).toBe("Status em atualização");
  });
});

describe("orderSteps", () => {
  it("lista as etapas na ordem do acompanhamento", () => {
    expect(orderSteps.map((s) => s.label)).toEqual([
      "Recebido",
      "Pagamento confirmado",
      "Enviado",
      "Entregue",
    ]);
  });
});

describe("orderProgress", () => {
  it("retorna o índice da etapa atual", () => {
    expect(orderProgress("new")).toBe(0);
    expect(orderProgress("delivered")).toBe(3);
  });

  it("retorna -1 para cancelado e status desconhecido", () => {
    expect(orderProgress("cancelled")).toBe(-1);
    expect(orderProgress("xyz")).toBe(-1);
  });
});

describe("normalizeOrderCode", () => {
  it("remove espaços e põe em maiúsculas", () => {
    expect(normalizeOrderCode("  tkabcd2345 ")).toBe("TKABCD2345");
  });

  it("remove tab e quebra de linha nas bordas", () => {
    expect(normalizeOrderCode("\ttkabcd2345\n")).toBe("TKABCD2345");
  });

  it("mantém código já normalizado", () => {
    expect(normalizeOrderCode("TKABCD2345")).toBe("TKABCD2345");
  });
});

describe("isValidOrderCode", () => {
  it("aceita código com 10 caracteres no formato TK + 8", () => {
    expect(isValidOrderCode("TKABCD2345")).toBe(true);
  });

  it("aceita código bruto só depois de normalizado", () => {
    expect(isValidOrderCode(normalizeOrderCode("  tkabcd2345 "))).toBe(true);
  });

  it("recusa código não normalizado (minúsculas ou espaços nas bordas)", () => {
    expect(isValidOrderCode("tkabcd2345")).toBe(false);
    expect(isValidOrderCode(" TKABCD2345")).toBe(false);
    expect(isValidOrderCode("TKABCD2345 ")).toBe(false);
  });

  it("rejeita código com tamanho errado", () => {
    expect(isValidOrderCode("TKABCD234")).toBe(false);
    expect(isValidOrderCode("TKABCD23450")).toBe(false);
  });

  it("rejeita cada caractere proibido (0, O, I, L, 1)", () => {
    expect(isValidOrderCode("TK0BCD2345")).toBe(false);
    expect(isValidOrderCode("TKABCD234O")).toBe(false);
    expect(isValidOrderCode("TKABCD23I5")).toBe(false);
    expect(isValidOrderCode("TKABCD2L45")).toBe(false);
    expect(isValidOrderCode("TKABCD1345")).toBe(false);
  });

  it("rejeita caracteres não alfanuméricos e quebra de linha no fim", () => {
    expect(isValidOrderCode("TKABCD23-5")).toBe(false);
    expect(isValidOrderCode("TKABCD2345\n")).toBe(false);
  });

  it("rejeita prefixo errado", () => {
    expect(isValidOrderCode("XXABCD2345")).toBe(false);
  });

  it("rejeita vazio", () => {
    expect(isValidOrderCode("")).toBe(false);
  });
});

describe("parseCodeParam", () => {
  it("retorna vazio quando não há parâmetro", () => {
    expect(parseCodeParam(undefined)).toBe("");
  });

  it("normaliza um valor simples", () => {
    expect(parseCodeParam("tkabcd2345")).toBe("TKABCD2345");
  });

  it("usa só o primeiro valor de uma lista", () => {
    expect(parseCodeParam(["tkabcd2345", "x"])).toBe("TKABCD2345");
  });

  it("retorna vazio para lista vazia", () => {
    expect(parseCodeParam([])).toBe("");
  });
});
