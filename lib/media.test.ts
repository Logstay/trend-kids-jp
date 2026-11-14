import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiUpload } from "./admin";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, imageSrc, uploadProductImage, validateImageFile } from "./media";

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

describe("uploadProductImage", () => {
  it("manda o arquivo no campo 'image' para a rota do produto", async () => {
    const fn = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: "p1", image: "/uploads/a.png" }), { status: 200 })));
    vi.stubGlobal("fetch", fn);
    const file = new File(["x"], "foto.png", { type: "image/png" });

    await uploadProductImage("p1", file);

    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/admin/products/p1/image");
    expect((init.body as FormData).get("image")).toBeInstanceOf(File);
  });
});
