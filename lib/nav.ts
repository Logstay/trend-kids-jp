/** Seções que existem só na landing (cada uma tem um `id` no componente correspondente). */
export type HomeSection = "novidades" | "categorias" | "historia";

/**
 * Link para uma seção da landing que funciona de QUALQUER página.
 * Uma âncora solta (`#novidades`) só funciona na própria landing; na /loja o clique não leva a lugar nenhum.
 */
export const homeSection = (id: HomeSection): string => `/#${id}`;

export type NavLink = { label: string; href: string };

/** Primeiro item do menu do topo: sempre leva ao início da landing. */
export const homeNav: NavLink = { label: "Início", href: "/" };

export const navLinks: NavLink[] = [
  { label: "Nossa história", href: homeSection("historia") },
  // O rodapé (id="contato") está em todas as páginas públicas, então aqui a âncora local basta.
  { label: "Contato", href: "#contato" },
];

export const footerLinks: NavLink[] = [
  { label: "Loja", href: "/loja" },
  { label: "Acompanhar pedido", href: "/pedido" },
  { label: "Nossa história", href: homeSection("historia") },
  { label: "Guia de tamanhos e trocas", href: "#contato" },
];

/**
 * Link com `#`: usa <a> nativo, que rola até a seção (de qualquer página) e atualiza a URL.
 * O <Link> do Next não rola para uma âncora na própria página, então só páginas reais usam <Link>.
 */
export const isSectionAnchor = (href: string): boolean => href.includes("#");
