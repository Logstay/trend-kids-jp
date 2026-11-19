export type ListView = "list" | "empty" | "empty-filtered" | "error";

/**
 * Qual das telas de uma listagem mostrar.
 * `storeEmpty` diz que a loja toda está vazia (não só o filtro); só importa quando `items` é vazio.
 * `items === null` significa que não foi possível carregar (erro), o que é diferente de "vazio":
 * dizer "a loja está vazia" quando na verdade a API caiu seria mentir para o cliente.
 */
export function listView(items: readonly unknown[] | null, filtered: boolean, storeEmpty = false): ListView {
  if (items === null) return "error";
  if (items.length > 0) return "list";
  // Filtro sem resultado só vale se a loja tem algo; com a loja inteira vazia, é a tela de loja vazia.
  return filtered && !storeEmpty ? "empty-filtered" : "empty";
}

/**
 * Os nomes das categorias (filtros, blocos de coleção) só aparecem quando há o que filtrar. Com a loja vazia ou com
 * falha ao carregar, a tela mostra só o estado vazio. No "filtro sem resultado" a loja tem produtos, então o menu Loja
 * (no cabeçalho) segue permitindo trocar de categoria; esta função só diz se a tela mostra o conteúdo filtrável.
 */
export function showsCategories(view: ListView): boolean {
  return view === "list" || view === "empty-filtered";
}
