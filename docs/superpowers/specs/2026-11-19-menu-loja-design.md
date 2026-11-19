# Menu "Loja" com submenu (categorias e novidades dentro da Loja)

Data: 2026-11-19 · Status: **aprovado**

## Intenção e por quê

O menu do topo hoje tem "Novidades" e "Categorias", que são âncoras da landing, e os filtros (Todos, Classic…) são uma
linha de botões na `/loja` (e uma cópia igual na landing). Quem pediu (dona da loja) quer que **Novidades e os filtros só
existam dentro da área da Loja**, porque fora dela (história, contato) só atrapalham.

## Objetivos

- Cabeçalho enxuto: `Loja ▾` · `Nossa história` · `Contato`.
- Submenu da Loja com: **Todos os modelos**, **Novidades**, e as categorias **Classic, Com luz, Sandálias, Charms, Forrados**.
- "Novidades" vira uma visão real da loja: produtos cadastrados nos últimos 14 dias (mesmo critério do selo "Novidade").
- Funciona no celular e por teclado.

## Fora do escopo

Menu hambúrguer; mega-menu; abrir ao passar o mouse; mais de um filtro ao mesmo tempo; busca; mudança na API.

## O que não pode acontecer

- O submenu ser o **único** caminho para `/loja` (o link "Loja" continua levando à loja).
- Perder acessibilidade (teclado, leitor de tela) ou o menu ficar preso aberto.
- Reaparecer nome de categoria dentro de um empty state (regra já combinada).

## Abordagens consideradas

- **A) Menu suspenso "Loja ▾" no cabeçalho (escolhida pela dona da loja).** Cabeçalho limpo, acesso de qualquer página.
  Custo: precisa de um componente de cliente e cuidado com teclado/celular.
- B) Barra de abas só dentro da `/loja`. Mais simples, mas deixa categorias e novidades fora do menu. Não foi a escolhida.
- C) Os dois. Mais código sem ganho claro.

## Desenho (decisões)

**Cabeçalho.** `Loja` é um **link** (vai para `/loja`) com um **botão de seta** ao lado que abre o painel (botão separado do link,
para o link nunca deixar de funcionar, nem sem JavaScript). Itens do painel, nesta ordem: Todos os modelos · Novidades · (linha
divisória) · Classic · Com luz · Sandálias · Charms · Forrados. O item da visão atual leva `aria-current`.

**Comportamento.** Abre por clique, Enter ou Espaço (não por hover). Fecha com Esc (o foco volta ao botão), clique fora, ao escolher
um item e ao trocar de página. `aria-expanded` e `aria-controls` no botão. No celular é o mesmo painel, em largura total sob o item
(o cabeçalho já quebra em linhas; não há hambúrguer).

**`/loja`.**
- A linha de filtros sai da página (agora vive no submenu).
- URLs: `/loja` (todos), `/loja?categoria=Classic`, `/loja?novidades=1`. **Um filtro por vez.**
- Quando há filtro, uma linha curta abaixo do título diz o que está sendo mostrado ("Mostrando: Classic · ver todos").
- "Novidades" = produtos criados nos últimos 14 dias, filtrados no servidor (sem mudar a API). Sem nenhum, aparece o estado
  "Nada novo por enquanto", com o botão "Ver todos os produtos".
- Os empty states já existentes ficam como estão.

**Landing.** "Novidades" e "Categorias" saem do menu do topo. As seções "Em alta agora" e os blocos de coleção continuam como
vitrine (os blocos já levam a `/loja?categoria=…`). Os botões de filtro de "Coleções em destaque" saem, e entra um link
"Ver todos os modelos".

## Decisões minhas (a dona da loja pode corrigir)

1. `Loja` link + seta separada, em vez de um botão único que só abre o menu.
2. O submenu **sempre lista as categorias**, mesmo com a loja vazia: ele fica fechado por padrão, e o cabeçalho não passa a chamar a
   API em toda página só para saber se há produtos. A regra "sem nomes de categoria no empty state" vale para o conteúdo da página.
3. Um filtro por vez (categoria **ou** novidades).
4. Tirar também os botões de filtro da landing ("Coleções em destaque").
5. "Novidades" = 14 dias, o mesmo número do selo.

## O que fica para quem for construir

Nomes e estilos (usar os tokens do design system); como ler o filtro atual dentro do componente (em Next 15 o
`useSearchParams` exige um limite de `Suspense`); ordem exata de foco ao fechar. Testar: lógica pura (itens do menu, leitura do
filtro, "é novidade?") e o comportamento no navegador (abrir/fechar, Esc, clique fora, celular, `aria-current`, filtros e empty states).
