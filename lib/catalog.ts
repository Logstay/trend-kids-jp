// Tipos e conteúdo estático da landing. Produtos vêm sempre da API (nunca há produto de mentira).

export type Category = "Classic" | "Com luz" | "Sandálias" | "Forrados" | "Charms";

export type Product = {
  name: string;
  /** Campos presentes só nos produtos que vêm da API (os placeholders não têm, e por isso não vão à sacola). */
  id?: string;
  slug?: string;
  stock?: number;
  priceCents?: number;
  category: Category;
  price: string;
  isNew?: boolean;
  /** Descrição da foto que deve entrar aqui (placeholder até existir foto real). */
  photo: string;
  image?: string;
};

export const featuredFilters = ["Todos", "Classic", "Com luz", "Sandálias", "Charms"] as const;
export type FeaturedFilter = (typeof featuredFilters)[number];

export const categories = [
  { label: "Classic", photo: "Foto: Crocs Classic em várias cores", tone: "rosa" },
  { label: "Com luz", photo: "Foto: Crocs com luz na sola", tone: "rosa" },
  { label: "Sandálias", photo: "Foto: sandálias Crocband", tone: "rosa" },
  { label: "Charms", photo: "Foto: charms encaixados no Crocs", tone: "azul" },
] as const;
