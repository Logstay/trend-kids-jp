/** Abaixo disso a landing esconde coleções e tendências: poucas peças deixam essas seções vazias ou repetidas. */
export const MIN_PRODUCTS_FOR_SECTIONS = 4;

export function showsCollections(productCount: number): boolean {
  return productCount >= MIN_PRODUCTS_FOR_SECTIONS;
}

export function showsTrending(productCount: number): boolean {
  return productCount >= MIN_PRODUCTS_FOR_SECTIONS;
}

/** Sorteia, entre os produtos que têm foto, o que aparece no hero. `random()` devolve [0, 1). */
export function pickHeroProduct<T extends { image?: string }>(items: readonly T[], random: () => number): T | null {
  const withPhoto = items.filter((p) => typeof p.image === "string" && p.image !== "");
  if (withPhoto.length === 0) return null;
  const index = Math.min(Math.floor(random() * withPhoto.length), withPhoto.length - 1);
  return withPhoto[index];
}

/**
 * Destino do botão "Lançamentos" do hero. A âncora #novidades só existe quando a seção de tendências aparece
 * (ou na tela de loja vazia/erro, com 0 produtos); com 1 a 3 produtos ela não existe, então vai para a loja.
 */
export function launchesHref(productCount: number): string {
  return productCount > 0 && !showsTrending(productCount) ? "/loja?novidades=1" : "#novidades";
}
