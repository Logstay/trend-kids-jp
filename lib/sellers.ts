import { API_URL } from "./api";
import { hasWhatsApp, type StoreSettings } from "./settings";

/** Vendedora como o site público recebe (só o necessário para levar o cliente ao WhatsApp dela). */
export type Seller = {
  id: string;
  name: string;
  /** Formato do wa.me (55 + DDD + número). */
  whatsapp: string;
  whatsapp_display: string;
};

/** Visão do painel: inclui se está ativa. */
export type AdminSeller = Seller & { active: boolean; created_at: string };

export const MAX_SELLERS = 20;

const WA_ME = /^\d{12,13}$/;

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;

function toSeller(raw: unknown): Seller | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  // Estes valores viram href: só passam com o formato exato.
  if (!isStr(r.id) || !isStr(r.name) || typeof r.whatsapp !== "string" || !WA_ME.test(r.whatsapp)) return null;
  return { id: r.id, name: r.name, whatsapp: r.whatsapp, whatsapp_display: typeof r.whatsapp_display === "string" ? r.whatsapp_display : "" };
}

function itemsOf(raw: unknown): unknown[] {
  const items = typeof raw === "object" && raw !== null ? (raw as { items?: unknown }).items : null;
  return Array.isArray(items) ? items : [];
}

/** Lê a lista pública com tolerância: o que estiver fora do formato é descartado. */
export function normalizeSellers(raw: unknown): Seller[] {
  const out: Seller[] = [];
  for (const item of itemsOf(raw)) {
    const s = toSeller(item);
    if (s) out.push(s);
    if (out.length >= MAX_SELLERS) break;
  }
  return out;
}

export function normalizeAdminSellers(raw: unknown): AdminSeller[] {
  const out: AdminSeller[] = [];
  for (const item of itemsOf(raw)) {
    const s = toSeller(item);
    const r = item as Record<string, unknown>;
    // Sem o campo `active` o item não vale: nunca se assume que uma vendedora está ativa.
    if (!s || typeof r.active !== "boolean") continue;
    out.push({ ...s, active: r.active, created_at: typeof r.created_at === "string" ? r.created_at : "" });
    if (out.length >= MAX_SELLERS) break;
  }
  return out;
}

/**
 * Vendedoras ativas, lidas no servidor. Se a API cair, devolve lista vazia: o site cai no WhatsApp de contato
 * e continua de pé (vendedoras são um recurso de atendimento, não uma listagem que o cliente espera ver).
 */
export async function getSellers(): Promise<Seller[]> {
  try {
    const res = await fetch(`${API_URL}/v1/sellers`, { next: { revalidate: 30, tags: ["sellers"] } });
    if (!res.ok) return [];
    return normalizeSellers(await res.json());
  } catch {
    return [];
  }
}

export const sellerHref = (s: Seller, message: string): string => `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(message)}`;

export type SellerOption = { id: string; name: string; display: string; href: string };

export type WhatsAppTarget =
  | { kind: "choose"; options: SellerOption[] } // 2+ vendedoras: o cliente escolhe
  | { kind: "direct"; href: string } // 1 vendedora, ou o contato geral quando não há vendedora
  | { kind: "none"; href: string }; // nada configurado: âncora de contato

/**
 * Para quem o cliente é levado quando pede o WhatsApp:
 *  - 2+ vendedoras ativas -> escolhe com quem falar;
 *  - 1 -> vai direto para ela;
 *  - nenhuma -> WhatsApp de contato da loja (se houver);
 *  - nada -> âncora de contato.
 * O contato geral nunca entra na lista de escolha: são coisas separadas.
 */
export function whatsappTarget(sellers: Seller[], settings: StoreSettings, message: string): WhatsAppTarget {
  if (sellers.length >= 2) {
    return { kind: "choose", options: sellers.map((s) => ({ id: s.id, name: s.name, display: s.whatsapp_display, href: sellerHref(s, message) })) };
  }
  if (sellers.length === 1) return { kind: "direct", href: sellerHref(sellers[0], message) };
  if (hasWhatsApp(settings)) return { kind: "direct", href: `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}` };
  return { kind: "none", href: "#contato" };
}
