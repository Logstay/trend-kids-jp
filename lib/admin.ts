import type { ApiProduct } from "./api";

/** Erro de chamada à API do painel. `status` 0 = sem conexão. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const GENERIC = "Algo deu errado. Tente novamente.";
const OFFLINE = "Sem conexão com o servidor. Tente novamente.";

/**
 * Chama a API pelo proxy do próprio site (`/api/*`, ver next.config.ts).
 * O cookie de sessão viaja sozinho (mesma origem) e nunca é lido pelo JavaScript (HttpOnly).
 */
export async function apiRequest<T = void>(method: string, path: string, body?: unknown): Promise<T> {
  return send<T>(method, path, { headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
}

/**
 * Envia um arquivo (multipart). Não fixa o Content-Type: o navegador precisa montá-lo sozinho,
 * porque o `boundary` do multipart só ele conhece.
 */
export async function apiUpload<T = void>(method: string, path: string, form: FormData): Promise<T> {
  return send<T>(method, path, { body: form });
}

async function send<T>(method: string, path: string, init: { headers?: Record<string, string>; body?: BodyInit }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method, headers: init.headers, body: init.body, credentials: "same-origin" });
  } catch {
    throw new ApiError(0, OFFLINE); // não repassa a mensagem interna do fetch
  }

  if (!res.ok) {
    let message = GENERIC;
    try {
      const data = (await res.json()) as { error?: unknown };
      if (typeof data.error === "string" && data.error) message = data.error;
    } catch {
      /* resposta de erro que não é JSON: fica a mensagem genérica */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Corpo completo do PUT. Estoque, id e slug não entram: estoque só muda por ajuste, slug é fixo. */
export function putBodyFrom(p: ApiProduct, patch: Partial<Pick<ApiProduct, "name" | "category" | "description" | "price_cents" | "active">> = {}) {
  const merged = { ...p, ...patch };
  return {
    name: merged.name,
    category: merged.category,
    description: merged.description,
    price_cents: merged.price_cents,
    active: merged.active,
  };
}

/** Nome antigo, mantido para o painel. */
export const adminRequest = apiRequest;

const MAX_INT_DIGITS = 9;

/**
 * Converte o que a pessoa digitou ("189,90", "R$ 1.234,50", "49") em centavos inteiros.
 * Só aritmética inteira: float transformaria 19,99 em 1998. Devolve null se for inválido ou zero.
 */
export function parsePriceToCents(input: string): number | null {
  const s = input.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!/^[\d.,]+$/.test(s)) return null;

  let whole: string;
  let frac = "";

  if (s.includes(",")) {
    const parts = s.split(",");
    if (parts.length !== 2) return null;
    whole = parts[0].replace(/\./g, ""); // pontos antes da vírgula são milhar
    frac = parts[1];
    if (frac.length < 1 || frac.length > 2) return null;
  } else if (s.includes(".")) {
    const parts = s.split(".");
    const last = parts[parts.length - 1];
    if (parts.length === 2 && last.length >= 1 && last.length <= 2) {
      whole = parts[0]; // "189.90": ponto decimal
      frac = last;
    } else if (parts.slice(1).every((p) => p.length === 3)) {
      whole = parts.join(""); // "1.234" ou "1.234.567": milhar
    } else {
      return null;
    }
  } else {
    whole = s;
  }

  if (!/^\d+$/.test(whole) || whole.length > MAX_INT_DIGITS) return null;
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return cents > 0 ? cents : null;
}

export function centsToInput(cents: number): string {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}
