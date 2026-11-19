export type ListView = "list" | "empty" | "empty-filtered" | "error";

/**
 * Qual das telas de uma listagem mostrar.
 * `items === null` significa que não foi possível carregar (erro), o que é diferente de "vazio":
 * dizer "a loja está vazia" quando na verdade a API caiu seria mentir para o cliente.
 */
export function listView(items: readonly unknown[] | null, filtered: boolean): ListView {
  if (items === null) return "error";
  if (items.length > 0) return "list";
  return filtered ? "empty-filtered" : "empty";
}

/**
 * Os nomes das categorias (filtros, blocos de coleção) só aparecem quando há o que filtrar. Com a loja vazia ou com
 * falha ao carregar, a tela mostra só o estado vazio. No "filtro sem resultado" ficam, para dar para trocar de categoria.
 */
export function showsCategories(view: ListView): boolean {
  return view === "list" || view === "empty-filtered";
}
