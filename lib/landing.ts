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
