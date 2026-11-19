import { ApiError, apiRequest, apiUpload } from "./admin";
import type { ApiProduct } from "./api";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Fotos por produto (o back recusa a 9ª). */
export const MAX_IMAGES = 8;

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

/** Move a foto uma posição (-1 esquerda, +1 direita). Nas pontas ou com chave desconhecida, devolve a mesma ordem. */
export function moveKey(keys: readonly string[], key: string, dir: -1 | 1): string[] {
  const i = keys.indexOf(key);
  const j = i + dir;
  const next = [...keys];
  if (i < 0 || j < 0 || j >= keys.length) return next;
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Leva a foto para o começo (a primeira é a capa) e mantém a ordem das outras. */
export function makeCover(keys: readonly string[], key: string): string[] {
  if (!keys.includes(key)) return [...keys];
  return [key, ...keys.filter((k) => k !== key)];
}

/** Próximo índice do carrossel, dando a volta nas pontas. Nunca devolve negativo nem NaN. */
export function nextIndex(index: number, count: number, dir: -1 | 1): number {
  if (!Number.isFinite(count) || count <= 1) return 0;
  const base = Number.isFinite(index) ? index : 0;
  return (((base + dir) % count) + count) % count;
}

export type UploadPlan = { accepted: File[]; problems: string[] };

/**
 * Decide quais dos arquivos escolhidos podem ser enviados: tipo/tamanho válidos e só as vagas que sobraram
 * na galeria. Quem passa do limite é listado, não some em silêncio.
 */
export function planUploads(files: readonly File[], existingCount: number): UploadPlan {
  const problems: string[] = [];
  const valid: File[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const id = `${file.name}|${file.size}`;
    if (seen.has(id)) continue; // o mesmo arquivo escolhido duas vezes
    seen.add(id);
    const problem = validateImageFile(file);
    if (problem) problems.push(`${file.name}: ${problem}`);
    else valid.push(file);
  }

  const slots = Math.max(0, MAX_IMAGES - existingCount);
  const accepted = valid.slice(0, slots);
  const dropped = valid.slice(slots);
  if (dropped.length > 0) {
    problems.push(
      slots === 0
        ? `Este produto já tem ${MAX_IMAGES} fotos (limite de ${MAX_IMAGES}).`
        : `Só cabem mais ${slots} ${slots === 1 ? "foto" : "fotos"} (limite de ${MAX_IMAGES} por produto). Não foram enviadas: ${dropped.map((d) => d.name).join(", ")}.`,
    );
  }
  return { accepted, problems };
}

export type UploadOutcome = { sent: number; failed: { name: string; message: string }[]; unauthorized: boolean };

/**
 * Envia as fotos UMA POR VEZ, na ordem escolhida (a ordem da galeria é a ordem de chegada). Se uma falha, segue com as
 * outras e informa qual falhou. Sessão expirada interrompe tudo.
 */
export async function uploadProductImages(productId: string, files: readonly File[]): Promise<UploadOutcome> {
  const outcome: UploadOutcome = { sent: 0, failed: [], unauthorized: false };
  for (const file of files) {
    const form = new FormData();
    form.append("image", file);
    try {
      await apiUpload<ApiProduct>("POST", `/v1/admin/products/${productId}/images`, form);
      outcome.sent++;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        outcome.unauthorized = true;
        break;
      }
      outcome.failed.push({ name: file.name, message: err instanceof ApiError ? err.message : "erro inesperado" });
    }
  }
  return outcome;
}

export const removeProductImage = (productId: string, key: string): Promise<ApiProduct> =>
  apiRequest<ApiProduct>("DELETE", `/v1/admin/products/${productId}/images/${encodeURIComponent(key)}`);

export const reorderProductImages = (productId: string, keys: readonly string[]): Promise<ApiProduct> =>
  apiRequest<ApiProduct>("PUT", `/v1/admin/products/${productId}/images/order`, { keys });
