import type { Category } from "./catalog";
export const shopCategories = ["Classic", "Com luz", "Sandálias", "Charms", "Forrados"] as const satisfies readonly Category[];
export type ShopCategory = (typeof shopCategories)[number];

export type ShopFilter =
  | { kind: "all" }
  | { kind: "novidades" }
  | { kind: "categoria"; categoria: ShopCategory };

export type ShopMenuItem = {
  id: string;
  label: string;
  href: string;
  group: "geral" | "categoria";
};

export const shopMenuItems: readonly ShopMenuItem[] = [
  { id: "all", label: "Todos os modelos", href: "/loja", group: "geral" },
  { id: "novidades", label: "Novidades", href: "/loja?novidades=1", group: "geral" },
  ...shopCategories.map(
    (c): ShopMenuItem => ({
      id: `categoria:${c}`,
      label: c,
      href: `/loja?categoria=${encodeURIComponent(c)}`,
      group: "categoria",
    }),
  ),
];

type Param = string | string[] | undefined;

const toList = (value: Param): string[] => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

const isShopCategory = (value: string): value is ShopCategory =>
  (shopCategories as readonly string[]).includes(value);

export function parseShopFilter(params: { categoria?: Param; novidades?: Param }): ShopFilter {
  if (toList(params.novidades).includes("1")) return { kind: "novidades" };
  const categoria = toList(params.categoria).find(isShopCategory);
  return categoria ? { kind: "categoria", categoria } : { kind: "all" };
}

export function activeMenuItemId(pathname: string, filter: ShopFilter): string | null {
  if (pathname !== "/loja") return null;
  return filter.kind === "categoria" ? `categoria:${filter.categoria}` : filter.kind;
}

export function apiFilterFor(filter: ShopFilter): { category?: string; sort: "newest"; limit: 50 } {
  return filter.kind === "categoria"
    ? { category: filter.categoria, sort: "newest", limit: 50 }
    : { sort: "newest", limit: 50 };
}

export function selectProducts<T extends { isNew?: boolean }>(products: T[], filter: ShopFilter): T[] {
  return filter.kind === "novidades" ? products.filter((p) => p.isNew === true) : [...products];
}

export function emptyFilteredCopy(filter: ShopFilter): { title: string; text: string } {
  if (filter.kind === "novidades") {
    return {
      title: "Nada novo por enquanto",
      text: "Não chegou nenhum modelo nos últimos 14 dias. Veja todos os modelos da loja.",
    };
  }
  if (filter.kind === "categoria") {
    return {
      title: `Nada em “${filter.categoria}” por enquanto`,
      text: "Esses pares acabaram ou ainda estão chegando. Dá uma olhada nas outras coleções.",
    };
  }
  return { title: "Nada por aqui por enquanto", text: "Volte em breve para ver os modelos." };
}

export function filterSummary(filter: ShopFilter): string | null {
  if (filter.kind === "novidades") return "Novidades";
  return filter.kind === "categoria" ? filter.categoria : null;
}
