import { apiUpload } from "./admin";
import type { ApiProduct } from "./api";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * URL para exibir a foto. Fotos servidas pela nossa API (`/uploads/...`) passam pelo proxy do site
 * (`/api/uploads/...`), então funcionam em qualquer domínio. URL https externa (CDN/S3) vale como veio.
 * Qualquer outra coisa (javascript:, data:, //host, http:, caminho estranho) não vira imagem.
 */
export function imageSrc(image: string | null | undefined): string | undefined {
  if (!image) return undefined;
  if (/^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(image)) return `/api${image}`;
  if (/^https:\/\/[^\s/]+\/\S*$/.test(image)) return image;
  return undefined;
}

/**
 * Conferência rápida no navegador, só para dar resposta imediata. Quem decide de verdade é o servidor,
 * que olha o conteúdo do arquivo (esta checagem usa o tipo informado, que pode ser falso).
 */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "Formato não suportado: envie uma foto em JPEG, PNG ou WebP.";
  if (file.size === 0) return "O arquivo está vazio.";
  if (file.size > MAX_IMAGE_BYTES) return "A imagem é grande demais: o máximo é 5 MB.";
  return null;
}

export function uploadProductImage(productId: string, file: File): Promise<ApiProduct> {
  const form = new FormData();
  form.append("image", file);
  return apiUpload<ApiProduct>("POST", `/v1/admin/products/${productId}/image`, form);
}
