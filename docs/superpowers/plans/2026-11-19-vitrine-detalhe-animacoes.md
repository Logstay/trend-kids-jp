# Vitrine honesta, página de produto, galeria e animações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Atender os 7 pedidos da dona da loja (alinhar botão no admin, botão Início, foto aleatória no hero, seções da landing só com produtos suficientes, carrossel real, página de detalhe do produto, transições suaves) e terminar a galeria de fotos (admin + carrossel).

**Architecture:** Front Next.js 15 (App Router) em `/home/kamoreirad/study/trend-kids-jp`. Sem mudança na API: `GET /v1/products/:slug` já existe (back em `/home/kamoreirad/study/trend-kids-api`, `internal/adapters/http/catalog.go`). Lógica pura em `lib/` com testes vitest; UI verificada no navegador (sem testing-library).

**Tech Stack:** Next 15, React 19, TS, vitest, CSS puro com tokens em `app/globals.css`.

**Spec:** pedidos do usuário nesta conversa (sem doc separado). Decisões minhas, a dona da loja pode corrigir:
1. "Início" = link para `/` que sempre leva ao topo (na própria landing rola suave ao topo).
2. "Do primeiro passo à escola" (blocos de coleção) e "Em alta agora" só aparecem com **4 ou mais produtos** cadastrados; "Em alta agora" com 4+ é um carrossel de verdade (arrastar com dedo/mouse, setas, sem repetir produto). Com menos, a vitrine "Coleções em destaque" já mostra os produtos.
3. Hero: sorteia, a cada carregamento, um produto **com foto** (foto + nome + link para o produto); sem produto com foto, mantém o bloco rosa de hoje.
4. Página `/loja/[slug]`: galeria (carrossel com setas, pontinhos, deslizar), nome, categoria, preço, descrição, estoque, botão de sacola e WhatsApp. Todo card de produto (landing, /loja, em alta, hero) leva para ela.
5. Transições: entrada suave (fade + leve subida) em toda troca de página e cards em cascata; respeita `prefers-reduced-motion`.

## Global Constraints

- Texto da interface em pt-BR; use `npm test` e `./node_modules/.bin/tsc --noEmit` (nunca `npx`).
- Cores/raios/espaçamentos só pelos tokens de `app/globals.css` (`--radius-sm`, `--tinta`, `--branco`…). Foco visível `outline: 3px solid var(--azul-escuro)`.
- Nunca imagem de IA; sem produto/foto reais, os blocos mostram o placeholder honesto de hoje.
- Empty states (loja vazia, erro, filtro) não mostram nomes de categorias além do já existente.
- `git add` só dos arquivos da tarefa (nunca `-A`); os arquivos não rastreados `.pnp.cjs`, `.pnp.loader.mjs`, `.yarn/`, `yarn.lock` são do usuário: não tocar.
- Servidor de dev do usuário: front 3000, API 8080, banco `trendkids`: **nunca** matar, escrever ou migrar neles. Testes em navegador: banco `trendkids_e2e`, portas 3100/8081.
- Respeitar `prefers-reduced-motion: reduce` em toda animação nova (sem movimento, só troca instantânea).
- Commits locais; não dar push.

## Review Focus

1. Carrossel com 1, 2, 3, 4 e 8 produtos e produto sem foto: nada repetido, nada quebrado, setas desabilitadas nas pontas.
2. `/loja/slug-inexistente` → 404 amigável; API fora do ar na página do produto → estado de erro (não 404 mentiroso).
3. Produto oculto (`active=false`) ou sem estoque: a página não deixa comprar o que não existe.
4. Galeria com 1 foto (sem setas/pontinhos), com 8 fotos, e sem foto.
5. Animação não pode esconder conteúdo se JS/animação falhar nem causar rolagem horizontal; `prefers-reduced-motion` desliga o movimento.

---

### Task 1: Botão alinhado no admin e botão "Início"

**Files:**
- Modify: `components/admin/SellersAdmin.tsx`, `app/globals.css`, `components/Header.tsx`, `lib/nav.ts`, `lib/nav.test.ts`
- Create (se preciso): `components/HomeLink.tsx`

**Interfaces:**
- Produces: item "Início" como **primeiro** item do `<nav aria-label="Principal">` (antes do `ShopMenu`).

- [ ] **Step 1: Alinhar "Cadastrar"** no formulário "Nova vendedora" (`SellersAdmin.tsx`, classe `admin-form--grid` com `align-items: end`): hoje o botão fica no topo da linha enquanto os campos têm rótulo em cima; o botão deve ficar alinhado pela base com os campos (mesma altura/linha dos inputs, não com o rótulo). Corrigir com a menor mudança de CSS/markup possível e conferir também o formulário "Novo produto" e qualquer outro `admin-form--grid`/`--inline` com botão.
- [ ] **Step 2: Botão "Início"** primeiro no menu do topo: `Link href="/"` que **sempre leva ao topo** (na landing: `window.scrollTo({top:0,behavior:"smooth"})` e sem recarregar; em outra página: navega para `/` já no topo). Estado atual com `aria-current="page"` na landing. Em `lib/nav.ts` declarar `homeNav = { label: "Início", href: "/" }` e testar em `lib/nav.test.ts` (nome, href, que `navLinks` continua só "Nossa história" e "Contato").
- [ ] **Step 3: Verificar** `./node_modules/.bin/tsc --noEmit && npm test`; commit `feat: botão Início e botão Cadastrar alinhado no admin`.

---

### Task 2: Lógica da landing (limites) e hero com foto sorteada

**Files:**
- Create: `lib/landing.ts`, `lib/landing.test.ts`
- Modify: `components/Hero.tsx`, `app/page.tsx`, `lib/empty.ts` (só se necessário)

**Interfaces:**
- Produces em `lib/landing.ts`:
  - `export const MIN_PRODUCTS_FOR_SECTIONS = 4`
  - `export function showsCollections(productCount: number): boolean` (≥ 4)
  - `export function showsTrending(productCount: number): boolean` (≥ 4)
  - `export function pickHeroProduct<T extends { image?: string }>(items: readonly T[], random: () => number): T | null` — escolhe entre os que têm `image` (string não vazia); `random()` em [0,1); lista sem foto/vazia → `null`; índice `Math.floor(random()*n)` limitado a `n-1`.

- [ ] **Step 1: Testes primeiro** (`lib/landing.test.ts`): limites 0,3 → false; 4,5,8 → true; `pickHeroProduct` ignora sem foto, `random=0` → primeiro com foto, `random=0.9999` → último com foto, `random` retornando 1 não estoura, vazio e só-sem-foto → null, não muta a entrada.
- [ ] **Step 2: Implementar** `lib/landing.ts`.
- [ ] **Step 3: Hero** (`components/Hero.tsx`, servidor): nova prop `product?: Product | null`. Com produto: `Photo` com `src={product.image}` e `label={product.name}`, dentro de um `Link` para `/loja/${product.slug}` (a rota vem na Task 4: já deixar o href pronto; se `slug` faltar, usar `/loja`); mantém a etiqueta `fromPrice`. Sem produto: o bloco rosa atual. Garantir que a imagem preenche o bloco sem distorcer (`object-fit: cover`, já usado em `.photo__img`, conferir).
- [ ] **Step 4: `app/page.tsx`**: `const hero = pickHeroProduct(items, Math.random)` (a página é dinâmica, sorteia a cada carregamento; comentar isso); `Hero product={hero}`; `<Categories />` só se `showsCategories(view) && showsCollections(items.length)`; `Trending` só se `showsTrending(items.length)` (Task 3 reescreve o componente). `Featured` continua com os produtos.
- [ ] **Step 5: Verificar e commitar** `feat: hero com foto sorteada e seções da landing só com produtos suficientes`.

---

### Task 3: "Em alta agora" como carrossel de verdade

**Files:**
- Modify: `components/Trending.tsx`, `app/globals.css`
- Create (opcional): `lib/carousel.ts`, `lib/carousel.test.ts` (só lógica pura que valer teste, ex.: índice ativo a partir de `scrollLeft`/larguras, limites de seta)

**Interfaces:**
- Consumes: `showsTrending` (Task 2). O componente só é montado com 4+ produtos, mas deve se comportar bem com qualquer n≥1.
- Produces: `Trending({ products }: { products: Product[] })` (client).

- [ ] **Step 1: Reescrever** com **scroll-snap horizontal** (`overflow-x: auto; scroll-snap-type: x mandatory`; cada card `scroll-snap-align: start/center`; barra de rolagem escondida): funciona com dedo (nativo) e, no desktop, com **arrastar do mouse** (pointer events: arrastar rola; clique sem arrasto continua abrindo o link; usar limiar de ~6px para não disparar o link depois de arrastar) e com as **setas** (`scrollBy` de um card, suave; `aria-label` Anterior/Próximo; **desabilitadas** na primeira/última posição) e teclado (as setas são botões). Sem duplicar produtos nem usar `% n`. Pontinhos refletem a posição real (atualizados no `scroll` com `requestAnimationFrame`) e são clicáveis (`aria-label="Ir para o produto N"`). Mostrar o card central "ativo" não é mais necessário: remover o destaque azul/altura variável; manter selo "Mais vendido" **somente** se existir um critério real — como não existe, **remover o selo** (não inventar). Cada card é `Link` para `/loja/${slug}` (ou `/loja` sem slug), com foto, nome e preço como hoje.
- [ ] **Step 2: CSS** em `globals.css`: `.trending__track` (flex, gap 24px, snap), cards com largura ~ `min(320px, 80vw)` (3 visíveis no desktop, ~1,2 no celular, para sugerir que dá para deslizar), `touch-action: pan-y` no que for arrastável, cursor `grab/grabbing`, sem rolagem horizontal da página. Reduced-motion: `scroll-behavior:auto`.
- [ ] **Step 3: Testes** só da lógica pura extraída (se extraída). Rodar `tsc` e `npm test`.
- [ ] **Step 4: Commit** `feat: Em alta agora vira carrossel que desliza (dedo, mouse, setas)`.

---

### Task 4: Página do produto `/loja/[slug]` com galeria

**Files:**
- Create: `app/loja/[slug]/page.tsx`, `app/loja/[slug]/not-found.tsx` (ou usar `notFound()` com UI global), `components/ProductGallery.tsx`
- Modify: `lib/api.ts` (+ `fetchProduct(slug)`), `lib/api.test.ts`, `components/Featured.tsx`, `app/loja/page.tsx` (cards), `lib/media.ts`/`lib/media.test.ts` só se precisar de helper
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `export async function fetchProduct(slug: string): Promise<ApiProduct | null>` em `lib/api.ts`: `GET ${API_URL}/v1/products/${encodeURIComponent(slug)}` com `cache:"no-store"`; **404 → `null`**; qualquer outro erro/rede → **lança** (a página mostra o estado de erro, não 404).
- Produces: `ProductGallery({ images, name }: { images: string[]; name: string })` (client): carrossel scroll-snap (um slide por vez, 4:5 ou 1:1 como `.photo`), setas (some com 1 foto; desabilitadas nas pontas), pontinhos clicáveis, deslizar com o dedo, **setas do teclado** quando focado, `aria-roledescription="carrossel"`, `aria-label`, cada slide `alt` = `${name} — foto N de M`; 0 fotos → bloco rosa com "Foto: {name}" (placeholder honesto). Usar `nextIndex` de `lib/media.ts` onde servir.

- [ ] **Step 1: Teste e implementação de `fetchProduct`** (`lib/api.test.ts`, no estilo dos testes existentes com `fetch` simulado): 200 → produto; 404 → `null`; 500 → lança; slug com caracteres especiais é codificado na URL.
- [ ] **Step 2: Página** `app/loja/[slug]/page.tsx` (servidor, `params` é Promise no Next 15): busca com `fetchProduct`; `null` ou `active===false` → `notFound()`; erro → estado de erro com `EmptyState` ("Não conseguimos carregar este produto", botões "Tentar de novo" e "Voltar para a loja"); `generateMetadata` com nome/descrição. Conteúdo: migalha "Loja › {categoria} › {nome}" (links), `ProductGallery`, categoria, `<h1>` nome, preço (`formatPrice`), descrição (omitir bloco se vazia), estoque ("Últimas N unidades" se N ≤ 3, "Em estoque", ou "Esgotado"), `AddToCart` (variante principal, desabilitado/ausente se esgotado — ver como `AddToCart` trata `stock`) e botão de WhatsApp (`WhatsAppCta`) com mensagem "Olá! Tenho interesse no {nome}". Header e Footer como nas outras páginas. Reutilizar `toProduct` para imagens.
- [ ] **Step 3: Links**: card de produto em `Featured` e em `app/loja/page.tsx` vira link para `/loja/${slug}` na foto e no nome (mantendo o botão de sacola independente: clicar nele **não** navega); sem `slug`, mantém como hoje.
- [ ] **Step 4: CSS** para a página (layout 2 colunas ≥ 900px, 1 coluna no celular; sem rolagem horizontal; tokens do design system).
- [ ] **Step 5: Verificar** `tsc` + `npm test`; checar com `curl` read-only no dev do usuário que `/loja/nao-existe` responde 404 (se o servidor estiver de pé) — a conferência completa é a Task 7. Commit `feat: página do produto com galeria e links dos cards`.

---

### Task 5: Admin da galeria (todas as fotos, capa, ordem, remover)

**Files:**
- Modify: `components/admin/AdminProducts.tsx`, `app/globals.css`
- Test: `lib/media.test.ts` só se faltar caso nos helpers existentes (`moveKey`, `makeCover`, `reorderProductImages`, `removeProductImage`, `planUploads`, `uploadProductImages`, `MAX_IMAGES=8`)

**Interfaces:**
- Consumes: helpers de `lib/media.ts` listados acima (ler a assinatura exata antes).

- [ ] **Step 1: Galeria por produto** na linha do produto (botão "Fotos (N/8)" que expande, `aria-expanded`): miniaturas na ordem, a primeira marcada "Capa"; por foto: **Tornar capa** (`makeCover` + `reorderProductImages`), **←/→** mover (`moveKey`), **Remover** (`removeProductImage(p.id, key)`), com `aria-label` com o nome do produto e o número da foto; **Adicionar fotos** aceitando várias (`multiple`, `planUploads` para respeitar o limite e mostrar problemas por arquivo); mensagens de sucesso/erro como o resto do painel; 401 → `/admin/login`. Remover a ação provisória "Remover capa". Mostrar o contador e desabilitar adicionar com 8.
- [ ] **Step 2: Estilos** das miniaturas (grade, 44px de alvo de toque nos botões, foco visível). 
- [ ] **Step 3: Verificar** `tsc` + `npm test`; commit `feat: admin da galeria de fotos (capa, ordem, remover, várias fotos)`.

---

### Task 6: Transições de página suaves

**Files:**
- Create: `app/template.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: `app/template.tsx`** (client não é necessário; um wrapper `<div className="page-enter">`) que aplica animação de **entrada** em toda troca de rota (fade 0 → 1 + subida de 12px em ~350 ms, `ease-out`) — o `template` remonta a cada navegação, então a animação roda sempre. Não pode envolver o `Header` de um jeito que o faça "piscar": avaliar se o `Header` fica dentro de cada página (é o caso hoje); animar só o conteúdo de `<main>`/`.page-enter`, não o cabeçalho.
- [ ] **Step 2: Detalhes de movimento** em `globals.css`: cards (`.product`, `.cat`, `.trend-card`, `.admin-row`) entram em **cascata** (`animation-delay` por `:nth-child`, até ~6 itens, ≤ 60 ms entre eles); `:hover` suave nos cards (leve elevação/escala de foto ≤ 1.03); `@media (prefers-reduced-motion: reduce)` zera tudo (sem transform, sem delay). Conteúdo **nunca** fica invisível se a animação falhar (usar `animation-fill-mode: both` só com `from` em `opacity` via keyframes; sem estado inicial `opacity:0` fora do keyframe). Adicionar `@view-transition { navigation: auto; }` apenas se não causar piscadas (testar no Task 7); caso contrário não incluir.
- [ ] **Step 3: Verificar** `tsc` + `npm test`; commit `feat: transições suaves entre páginas e cards em cascata`.

---

### Task 7: Verificação no navegador e documentação

**Files:**
- Nenhum arquivo de produto (cópia isolada fora do repositório); depois `README.md` e commit dos docs do plano.

- [ ] **Step 1: Ambiente isolado** (banco `trendkids_e2e`, API de teste 8081 com `CORS_ORIGINS` incluindo `http://localhost:3100`, cópia do front na 3100, Chrome do Windows com CDP) e dados: 0, 1, 3, 4, 8 produtos (alguns com fotos reais de teste geradas localmente, sem imagem de IA; uma sem foto; um oculto; um sem estoque).
- [ ] **Step 2: Exigir 0 falhas** em: botão Cadastrar alinhado (medir `getBoundingClientRect` do botão x inputs); "Início" primeiro, leva ao topo (rolar até o fim, clicar, `scrollY===0`), também vindo de `/loja`; hero com foto sorteada (várias cargas mostram produtos diferentes quando há 2+ com foto) e placeholder sem foto; com 1 e 3 produtos **sem** "Do primeiro passo à escola" e **sem** "Em alta agora"; com 4+ ambos; carrossel: arrastar com mouse (CDP), setas, pontos, sem repetir, setas desabilitadas nas pontas, clique sem arrasto abre o produto, 390 px sem rolagem horizontal; página do produto: foto/nome/preço/descrição, galeria (setas, pontinhos, teclado), 1 foto sem controles, 0 fotos placeholder, esgotado/oculto (404), slug inexistente (404), API fora do ar (erro); adicionar à sacola na página; cards levam à página; admin da galeria: várias fotos, capa, mover, remover, limite 8; transições: ao navegar, `.page-enter` anima (checar `getAnimations()`), com `--force-prefers-reduced-motion` não há animação, nenhum conteúdo permanece invisível.
- [ ] **Step 3: Limpeza**: parar só os processos iniciados, apagar a cópia, o banco `trendkids_e2e` e os perfis de Chrome; conferir que `trendkids` não foi tocado.
- [ ] **Step 4: README** (seção curta: regras da vitrine — mínimo de 4 produtos, hero sorteado, página do produto, galeria no admin) e commit dos docs: `git add README.md docs/superpowers/plans/2026-11-19-vitrine-detalhe-animacoes.md`; `git commit -m "docs: plano e README da vitrine, página do produto e animações"`.
