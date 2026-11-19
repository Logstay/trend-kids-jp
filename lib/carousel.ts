/**
 * Lógica pura para carrosséis baseados em scroll-snap (sem DOM).
 * Usada pelo "Em alta agora" e reaproveitável na galeria do produto.
 */

/** Distância (px) a partir da qual um gesto deixa de ser clique e vira arrasto. */
export const DRAG_THRESHOLD_PX = 6;

/** Tolerância (px) para erros de arredondamento de scrollLeft/scrollWidth. */
const EDGE_TOLERANCE_PX = 2;

/**
 * Índice do item mais próximo da posição de rolagem atual.
 * `cardWidth` e `gap` em px; o resultado fica sempre em [0, count-1]
 * (0 se count < 1 ou se as medidas forem inválidas).
 */
export function activeIndex(scrollLeft: number, cardWidth: number, gap: number, count: number): number {
  const step = cardWidth + gap;
  if (count < 2 || !Number.isFinite(scrollLeft) || !Number.isFinite(step) || step <= 0) return 0;
  const raw = Math.round(scrollLeft / step);
  return Math.min(count - 1, Math.max(0, raw));
}

/**
 * Se ainda dá para rolar para trás (`prev`) e para frente (`next`).
 * Se tudo cabe na tela, as duas são false.
 */
export function canScroll(scrollLeft: number, clientWidth: number, scrollWidth: number): { prev: boolean; next: boolean } {
  const max = scrollWidth - clientWidth;
  if (max <= EDGE_TOLERANCE_PX) return { prev: false, next: false };
  return { prev: scrollLeft > EDGE_TOLERANCE_PX, next: scrollLeft < max - EDGE_TOLERANCE_PX };
}

/**
 * true se o deslocamento (com sinal) do ponteiro entre o press e o release
 * foi grande o bastante para ser um arrasto — e, portanto, o clique seguinte
 * deve ser ignorado.
 */
export function isDragClick(distancePx: number, thresholdPx: number = DRAG_THRESHOLD_PX): boolean {
  return Math.abs(distancePx) >= thresholdPx;
}

/**
 * Quantos pontos/posições de rolagem existem de verdade. Com N cards e vários
 * visíveis, os últimos snaps ficam presos no fim da rolagem; só os alcançáveis contam.
 * Posição i = i * (cardWidth + gap), com a última clampada ao máximo. Resultado em [min(1,count), count].
 */
export function reachableCount(scrollWidth: number, clientWidth: number, cardWidth: number, gap: number, count: number): number {
  if (count < 1) return 0;
  const step = cardWidth + gap;
  const max = scrollWidth - clientWidth;
  if (count === 1 || !Number.isFinite(step) || step <= 0 || !Number.isFinite(max) || max <= EDGE_TOLERANCE_PX) return 1;
  return Math.min(count, Math.ceil((max - EDGE_TOLERANCE_PX) / step) + 1);
}
