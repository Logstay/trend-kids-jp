import { API_URL } from "./api";
import { siteDefaults } from "./site";

/** Configurações públicas da loja, como a API entrega (já formatadas para o site). */
export type StoreSettings = {
  name: string;
  city: string;
  description: string;
  /** Formato do wa.me (55 + DDD + número); vazio = ainda não configurado. */
  whatsapp: string;
  whatsapp_display: string;
  phone: string;
  /** Para links tel:, ex.: +558332221234. */
  phone_tel: string;
  /** Só o usuário, sem @. */
  instagram: string;
  instagram_url: string;
};

export const defaultSettings: StoreSettings = {
  name: siteDefaults.name,
  city: siteDefaults.city,
  description: siteDefaults.description,
  whatsapp: "",
  whatsapp_display: "",
  phone: "",
  phone_tel: "",
  instagram: "",
  instagram_url: "",
};

const str = (v: unknown, fallback: string): string => (typeof v === "string" ? v : fallback);

// Estes valores viram href: só passam se tiverem exatamente o formato esperado.
const onlyIf = (value: string, pattern: RegExp): string => (pattern.test(value) ? value : "");

/**
 * Lê as configurações com tolerância: qualquer coisa fora do formato volta ao padrão, campo a campo.
 * Defesa em profundidade: mesmo vinda da nossa API, um valor estranho nunca vira um link perigoso.
 */
export function normalizeSettings(raw: unknown): StoreSettings {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return defaultSettings;
  const r = raw as Record<string, unknown>;
  const d = defaultSettings;
  return {
    name: str(r.name, d.name),
    city: str(r.city, d.city),
    description: str(r.description, d.description),
    whatsapp: onlyIf(str(r.whatsapp, ""), /^\d{12,13}$/),
    whatsapp_display: str(r.whatsapp_display, ""),
    phone: str(r.phone, ""),
    phone_tel: onlyIf(str(r.phone_tel, ""), /^\+\d{12,13}$/),
    instagram: onlyIf(str(r.instagram, ""), /^[A-Za-z0-9._]{1,30}$/),
    instagram_url: onlyIf(str(r.instagram_url, ""), /^https:\/\/www\.instagram\.com\/[A-Za-z0-9._]{1,30}$/),
  };
}

/**
 * Busca no servidor. Com a API fora do ar (ou resposta inválida) devolve os valores padrão:
 * o site nunca cai por causa das configurações. `fresh` pula o cache (usado no painel).
 */
export async function getSettings(opts: { fresh?: boolean } = {}): Promise<StoreSettings> {
  try {
    const res = await fetch(`${API_URL}/v1/settings`, opts.fresh ? { cache: "no-store" } : { next: { revalidate: 30, tags: ["settings"] } });
    if (!res.ok) return defaultSettings;
    return normalizeSettings(await res.json());
  } catch {
    return defaultSettings;
  }
}

export const hasWhatsApp = (s: StoreSettings): boolean => s.whatsapp !== "";

const DEFAULT_MESSAGE = "Olá! Vim pelo site e quero saber dos Crocs infantis.";

/** Link do WhatsApp. Sem número configurado aponta para a âncora de contato, nunca para um link quebrado. */
export function whatsappHref(s: StoreSettings, message: string = DEFAULT_MESSAGE): string {
  if (!hasWhatsApp(s)) return "#contato";
  return `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(message)}`;
}
