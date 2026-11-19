/** Texto de disponibilidade da página do produto. */
export function stockLabel(stock: number): string {
  if (!(stock > 0)) return "Esgotado";
  if (stock === 1) return "Última unidade";
  if (stock <= 3) return `Últimas ${stock} unidades`;
  return "Em estoque";
}
