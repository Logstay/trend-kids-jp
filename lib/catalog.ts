// Placeholders da landing: só aparecem quando a API está fora do ar (ver lib/api.ts).

export type Category = "Classic" | "Com luz" | "Sandálias" | "Forrados" | "Charms";

export type Product = {
  name: string;
  /** Presente nos produtos que vêm da API; usado para montar o link do produto. */
  slug?: string;
  category: Category;
  price: string;
  isNew?: boolean;
  /** Descrição da foto que deve entrar aqui (placeholder até existir foto real). */
  photo: string;
  image?: string;
};

export const featuredFilters = ["Todos", "Classic", "Com luz", "Sandálias", "Charms"] as const;
export type FeaturedFilter = (typeof featuredFilters)[number];

export const featured: Product[] = [
  { name: "Classic Clog Infantil Rosa", category: "Classic", price: "R$ [PREÇO]", isNew: true, photo: "Foto: Classic Clog rosa" },
  { name: "Crocs com Luz Fun Lab", category: "Com luz", price: "R$ [PREÇO]", isNew: true, photo: "Foto: Crocs com luz acesa" },
  { name: "Sandália Crocband Infantil", category: "Sandálias", price: "R$ [PREÇO]", photo: "Foto: sandália Crocband" },
  { name: "Kit 5 Charms Dinossauros", category: "Charms", price: "R$ [PREÇO]", isNew: true, photo: "Foto: charms de dinossauro" },
  { name: "Classic Clog Infantil Azul", category: "Classic", price: "R$ [PREÇO]", photo: "Foto: Classic Clog azul" },
  { name: "Classic com Luz Dino", category: "Com luz", price: "R$ [PREÇO]", photo: "Foto: Classic com luz, estampa dino" },
  { name: "Sandália Classic Infantil", category: "Sandálias", price: "R$ [PREÇO]", photo: "Foto: sandália Classic" },
  { name: "Kit 3 Charms Frutas", category: "Charms", price: "R$ [PREÇO]", photo: "Foto: charms de frutas" },
];

export const categories = [
  { label: "Classic", photo: "Foto: Crocs Classic em várias cores", tone: "rosa" },
  { label: "Com luz", photo: "Foto: Crocs com luz na sola", tone: "rosa" },
  { label: "Sandálias", photo: "Foto: sandálias Crocband", tone: "rosa" },
  { label: "Charms", photo: "Foto: charms encaixados no Crocs", tone: "azul" },
] as const;
