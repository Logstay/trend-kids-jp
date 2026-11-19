import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiUpload } from "./admin";
import {
  ALLOWED_IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES, imageSrc, makeCover, moveKey, nextIndex, planUploads, removeProductImage,
  reorderProductImages, uploadProductImages, validateImageFile,
} from "./media";

afterEach(() => vi.unstubAllGlobals());

describe("imageSrc", () => {
  it("foto servida pela própria API passa pelo proxy do site", () => {
    expect(imageSrc("/uploads/3f2b8c1e-5d4a-4b6f-9a1c-0e7d2f8b6a31.webp")).toBe("/api/uploads/3f2b8c1e-5d4a-4b6f-9a1c-0e7d2f8b6a31.webp");
  });

  it("URL https de CDN/S3 é usada como veio", () => {
    expect(imageSrc("https://cdn.exemplo.com/fotos/a.jpg")).toBe("https://cdn.exemplo.com/fotos/a.jpg");
  });

  it.each(["", undefined, null, "javascript:alert(1)", "data:text/html,<script>", "//evil.com/x.png", "http://inseguro.com/a.png", "uploads/sem-barra.png", "/uploads/../../etc/passwd", "/outra-rota/a.png"])(
    "valor estranho %j não vira imagem",
    (value) => {
      expect(imageSrc(value as string | undefined)).toBeUndefined();
    },
  );
});

describe("validateImageFile", () => {
  const file = (type: string, size: number) => ({ type, size });

  it("aceita JPEG, PNG e WebP dentro do limite", () => {
    for (const t of ALLOWED_IMAGE_TYPES) expect(validateImageFile(file(t, 1024))).toBeNull();
    expect(validateImageFile(file("image/png", MAX_IMAGE_BYTES))).toBeNull();
  });

  it("recusa outros tipos, com mensagem em português", () => {
    for (const t of ["image/svg+xml", "image/gif", "application/pdf", "text/html", ""]) {
      expect(validateImageFile(file(t, 1024))).toMatch(/JPEG, PNG ou WebP/);
    }
  });

  it("recusa arquivo vazio e arquivo acima de 5 MB", () => {
    expect(validateImageFile(file("image/png", 0))).toMatch(/vazio/);
    expect(validateImageFile(file("image/png", MAX_IMAGE_BYTES + 1))).toMatch(/5 MB/);
  });
});

describe("apiUpload", () => {
  it("envia o FormData SEM fixar o Content-Type (o navegador coloca o boundary)", async () => {
    const fn = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: "p1" }), { status: 200 })));
    vi.stubGlobal("fetch", fn);
    const form = new FormData();
    form.append("image", new Blob(["x"], { type: "image/png" }), "a.png");

    const out = await apiUpload<{ id: string }>("POST", "/v1/admin/products/p1/image", form);

    expect(out).toEqual({ id: "p1" });
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/admin/products/p1/image");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(form);
    expect(init.credentials).toBe("same-origin");
    expect(JSON.stringify(init.headers ?? {})).not.toMatch(/content-type/i);
  });

  it("traduz o erro da API em ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({ code: 400, error: "formato não suportado" }), { status: 400 }))));
    const err = await apiUpload("POST", "/x", new FormData()).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("formato não suportado");
  });

  it("falha de rede vira ApiError genérico, sem vazar detalhe interno", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("fetch failed ECONNREFUSED 127.0.0.1"))));
    const err = await apiUpload("POST", "/x", new FormData()).catch((e) => e);
    expect(err.status).toBe(0);
    expect(err.message).not.toMatch(/ECONNREFUSED|127\.0\.0\.1/);
  });
});

const f = (name: string, type = "image/png", size = 1024) => ({ name, type, size }) as File; // só para validação (lê name/type/size)
const real = (name: string) => new File(["x"], name, { type: "image/png" }); // para envio: o FormData precisa de um File de verdade

describe("moveKey / makeCover", () => {
  const keys = ["a", "b", "c", "d"];

  it("move uma foto uma posição para a esquerda ou para a direita", () => {
    expect(moveKey(keys, "c", -1)).toEqual(["a", "c", "b", "d"]);
    expect(moveKey(keys, "b", 1)).toEqual(["a", "c", "b", "d"]);
  });

  it("nas pontas não faz nada (devolve a mesma ordem)", () => {
    expect(moveKey(keys, "a", -1)).toEqual(keys);
    expect(moveKey(keys, "d", 1)).toEqual(keys);
  });

  it("chave desconhecida não muda nada", () => {
    expect(moveKey(keys, "zzz", 1)).toEqual(keys);
  });

  it("não altera a lista original", () => {
    const copy = [...keys];
    moveKey(keys, "c", -1);
    makeCover(keys, "d");
    expect(keys).toEqual(copy);
  });

  it("tornar capa leva a foto para o começo e mantém a ordem das outras", () => {
    expect(makeCover(keys, "c")).toEqual(["c", "a", "b", "d"]);
    expect(makeCover(keys, "a")).toEqual(keys);
    expect(makeCover(keys, "zzz")).toEqual(keys);
  });
});

describe("nextIndex (carrossel)", () => {
  it("avança e volta dando a volta nas pontas", () => {
    expect(nextIndex(0, 3, 1)).toBe(1);
    expect(nextIndex(2, 3, 1)).toBe(0);
    expect(nextIndex(0, 3, -1)).toBe(2);
    expect(nextIndex(1, 3, -1)).toBe(0);
  });

  it("com 0 ou 1 foto fica sempre em 0", () => {
    expect(nextIndex(0, 1, 1)).toBe(0);
    expect(nextIndex(0, 0, -1)).toBe(0);
  });

  it("índice fora da faixa é corrigido, nunca devolve NaN nem negativo", () => {
    expect(nextIndex(99, 3, 1)).toBeGreaterThanOrEqual(0);
    expect(nextIndex(-5, 3, -1)).toBeLessThan(3);
    expect(Number.isNaN(nextIndex(NaN, 3, 1))).toBe(false);
  });
});

describe("planUploads", () => {
  it("aceita arquivos válidos até completar o limite de fotos", () => {
    const plan = planUploads([f("a.png"), f("b.jpg", "image/jpeg")], 0);
    expect(plan.accepted).toHaveLength(2);
    expect(plan.problems).toEqual([]);
  });

  it("respeita as fotos que o produto já tem: só cabem as vagas que sobraram", () => {
    const files = Array.from({ length: 5 }, (_, i) => f(`f${i}.png`));
    const plan = planUploads(files, MAX_IMAGES - 2);
    expect(plan.accepted.map((x) => x.name)).toEqual(["f0.png", "f1.png"]);
    expect(plan.problems.join(" ")).toMatch(/limite de 8/);
    expect(plan.problems.join(" ")).toMatch(/f2\.png|3 foto/);
  });

  it("galeria cheia: não aceita nenhuma", () => {
    const plan = planUploads([f("a.png")], MAX_IMAGES);
    expect(plan.accepted).toEqual([]);
    expect(plan.problems.length).toBeGreaterThan(0);
  });

  it("arquivo inválido é recusado com o nome dele, sem derrubar os bons", () => {
    const plan = planUploads([f("ok.png"), f("desenho.svg", "image/svg+xml"), f("enorme.png", "image/png", MAX_IMAGE_BYTES + 1)], 0);
    expect(plan.accepted.map((x) => x.name)).toEqual(["ok.png"]);
    expect(plan.problems.join(" ")).toMatch(/desenho\.svg/);
    expect(plan.problems.join(" ")).toMatch(/enorme\.png/);
  });

  it("não deixa o mesmo arquivo entrar duas vezes na mesma escolha", () => {
    const a = f("a.png");
    expect(planUploads([a, a], 0).accepted).toHaveLength(1);
  });
});

describe("uploadProductImages (em ordem, uma por vez)", () => {
  const ok = (key: string) => Promise.resolve(new Response(JSON.stringify({ id: "p1", images: [{ key, url: "/uploads/" + key }] }), { status: 200 }));

  it("envia sequencialmente, para a ordem da galeria ser a ordem escolhida", async () => {
    const order: string[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      order.push(((init.body as FormData).get("image") as File).name);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return ok("x");
    }));

    const out = await uploadProductImages("p1", [real("1.png"), real("2.png"), real("3.png")]);

    expect(order).toEqual(["1.png", "2.png", "3.png"]);
    expect(maxInFlight).toBe(1);
    expect(out.sent).toBe(3);
    expect(out.failed).toEqual([]);
  });

  it("se uma falha, continua com as outras e informa qual falhou e por quê", async () => {
    let n = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      n++;
      return n === 2
        ? Promise.resolve(new Response(JSON.stringify({ code: 400, error: "formato não suportado" }), { status: 400 }))
        : ok("k" + n);
    }));

    const out = await uploadProductImages("p1", [real("1.png"), real("2.png"), real("3.png")]);

    expect(out.sent).toBe(2);
    expect(out.failed).toEqual([{ name: "2.png", message: "formato não suportado" }]);
  });

  it("sessão expirada (401) interrompe tudo em vez de insistir", async () => {
    const fn = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ code: 401, error: "sessão inválida" }), { status: 401 })));
    vi.stubGlobal("fetch", fn);

    const out = await uploadProductImages("p1", [real("1.png"), real("2.png"), real("3.png")]);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(out.unauthorized).toBe(true);
  });
});

describe("removeProductImage / reorderProductImages", () => {
  it("remove pela chave", async () => {
    const fn = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: "p1", images: [] }), { status: 200 })));
    vi.stubGlobal("fetch", fn);
    await removeProductImage("p1", "k1.webp");
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/admin/products/p1/images/k1.webp");
    expect(init.method).toBe("DELETE");
  });

  it("reordena mandando a lista completa de chaves", async () => {
    const fn = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: "p1", images: [] }), { status: 200 })));
    vi.stubGlobal("fetch", fn);
    await reorderProductImages("p1", ["b", "a"]);
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/admin/products/p1/images/order");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ keys: ["b", "a"] });
  });
});
