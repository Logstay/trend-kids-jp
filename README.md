# Trend Kids JP

Site da Trend Kids JP (Crocs infantis, João Pessoa). Next.js 15 (App Router) + TypeScript.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build normal do Next.js (landing estática + /loja no servidor)
npm test           # testes (vitest)
```

> `npm run export` (site 100% estático) **não funciona mais**: a `/loja` filtra por URL e precisa de servidor (decisão D6 da spec).

### Debug no VS Code

As configs ficam em `/home/logstay/studies/.vscode/launch.json`, junto com as de outros projetos (abra a pasta `studies` no VS Code, aba "Run and Debug"):
- **Trend Kids Site: servidor Next**: roda `npm run dev` num terminal de depuração; breakpoints em rotas, `page.tsx` e componentes de servidor.
- **Trend Kids Site: navegador**: abre o Chrome em `localhost:3000` com breakpoints no código do cliente (Chrome precisa estar instalado no mesmo sistema do VS Code).
- **Trend Kids: API + site (tudo)**: sobe a API e o site juntos.

Para ver as chamadas à API, suba a API com a config **Trend Kids API: servidor (debug)**.

## Back-end (API em Go)

Os produtos vêm da API (`trend-kids-api`, repositório separado). Defina a URL no ambiente:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080   # padrão
```

- Landing: busca 8 produtos. **API vazia** = estado vazio "A vitrine está sendo montada"; **API fora do ar** = estado de erro "Não conseguimos carregar a vitrine". Nunca há produto de mentira.
- `/loja?categoria=Classic`: lista da API; com a API fora do ar mostra o estado de erro, com "Tentar de novo" e WhatsApp.

## Menu da Loja

O cabeçalho tem `Loja ▾`, `Nossa história` e `Contato`. "Loja" é um link para `/loja`; a seta ao lado abre o submenu (por clique, Enter ou Espaço, nunca por hover; fecha com Esc, clique fora, ao escolher um item e ao trocar de página).

- Itens: Todos os modelos, Novidades, Classic, Com luz, Sandálias, Charms, Forrados. O submenu **sempre lista as categorias**, mesmo com a loja vazia.
- Filtros por URL, um por vez: `/loja?categoria=Classic` ou `/loja?novidades=1` (se vierem os dois, vale Novidades; categoria inválida mostra a loja inteira).
- **Novidades = produtos criados nos últimos 14 dias** (o mesmo critério do selo "Novidade"), filtrados no servidor do Next, sem mudança na API.
- A landing não tem mais botões de filtro: há o link "Ver todos os modelos".

## Como ver as chamadas ao back

O navegador quase nunca chama `localhost:8080` direto, então a aba Network **não** mostra a API:
- **Listagens** (landing, `/loja`, painel) são buscadas pelo **servidor do Next** (`ua=node` no log da API).
- **Ações** (login, pedido, configurações) vão para `localhost:3000/api/…`, e o Next repassa à API.

Quem mostra tudo é o **log da API**: uma linha por requisição (método, caminho, status, latência, origem). Um `403` com `origin=` é CORS:
a origem do site não está em `CORS_ORIGINS`. As listagens **não usam cache**: se a API cair, a tela mostra o estado de erro na hora.

## Sacola e checkout (`/sacola`)

- Botão de adicionar à sacola na `/loja` e na landing (só para produtos que vêm da API). Respeita o estoque e o limite de 20 unidades.
- A sacola fica no `localStorage` (sobrevive a recarregar, sincroniza entre abas e tolera dado corrompido). Ela guarda **só produto e quantidade**;
  o preço exibido é informativo, o servidor recalcula tudo ao criar o pedido.
- `Fechar pedido` chama `POST /api/v1/orders`. A confirmação mostra o código (`TK…`) e o total reais. O botão do WhatsApp só aparece com
  o número configurado em `lib/site.ts`.
- **`CORS_ORIGINS` da API precisa incluir o domínio do site**: como o site repassa `/api/*`, a API enxerga a origem dele. Sem isso os `POST` dão 403.
- Ainda não existe tela de acompanhamento do pedido (o endpoint `POST /v1/orders/lookup` já existe no back).

## Configurações da loja (`/admin/configuracoes`)

WhatsApp, telefone, Instagram, cidade, nome e descrição **não ficam mais no código**: vêm do banco e são editados no painel.
Eles aparecem nos botões de WhatsApp, no rodapé, em "Nossa história", na mensagem dos pedidos e no título/descrição do site.

- Ao salvar, o painel limpa o cache das páginas públicas (ação de servidor, só com sessão válida); sem isso o site levaria até 30 s para mostrar a mudança.
- Contato vazio = não configurado: o botão de WhatsApp aponta para o contato e o rodapé não mostra o item.
- Se a API cair, o site usa os valores padrão de `lib/site.ts` e continua no ar.
- O "a partir de R$ …" do herói é calculado do menor preço real do catálogo (some se não houver produtos).

## Vendedoras e WhatsApp (`/admin/vendedoras`)

O **WhatsApp de contato** (aba "Contato da loja") e as **vendedoras** são coisas separadas:
- Contato da loja: atendimento geral. Aparece no rodapé e é o plano B quando não há vendedora ativa.
- Vendedoras: nome + WhatsApp cada uma, ativa/inativa. Para onde o cliente vai quando clica em qualquer botão de WhatsApp:
  - **2 ou mais ativas** → abre o seletor "Com quem você quer falar?" (`<dialog>` nativo);
  - **1 ativa** → vai direto para ela;
  - **nenhuma** → WhatsApp de contato (ou a âncora `#contato` se também não houver).
- O mesmo vale para o botão da confirmação do pedido (a mensagem com o código vai para a vendedora escolhida).

## Foto do produto

No `/admin` o produto tem **até 8 fotos** (JPEG, PNG ou WebP, até 5 MB cada). Dá para escolher várias ao criar o produto, e depois pela galeria da lista ("Fotos"): adicionar, definir a capa, reordenar e remover. A primeira é a capa.
- A foto aparece na landing, na `/loja` e na miniatura do painel, com o **nome do produto** como texto alternativo. Sem foto, o bloco rosa continua.
- O navegador só confere o tipo para responder rápido; quem decide é o servidor, pelo **conteúdo** do arquivo. O nome é gerado pelo servidor.
- As fotos são servidas pela API e chegam pelo proxy do site (`/api/uploads/...`), então funcionam em qualquer domínio.
- Se o servidor recusar a foto ao criar o produto, o produto **não se perde**: a tela avisa e a foto pode ser reenviada pela lista.
- Produção: a API grava em `UPLOAD_DIR`, que precisa ser um volume persistente (ou trocar o armazenamento por S3/R2).

## Painel (`/admin`)

Login, lista de produtos, cadastro, ocultar/mostrar na loja e ajuste de estoque (entrada/saída com motivo).

- O site repassa `/api/*` para a API (`next.config.ts`), então o cookie de sessão nasce na origem do site.
  O navegador nunca fala direto com a API do painel e o JavaScript não enxerga o cookie (HttpOnly).
- `/admin` é renderizada no servidor: sem sessão válida redireciona para `/admin/login`.
- **Atrás do proxy, a API precisa de `TRUSTED_PROXIES`** com o IP do servidor do site; sem isso o limite
  de tentativas de login vira global (um atacante travaria o dono). Veja o `.env.example` da API.
- O dono é criado na API: `go run ./cmd/createadmin -email ...` (não existe cadastro público).

## Vitrine, página do produto e galeria

- **Landing:** "Coleções em destaque" e "Em alta agora" só aparecem com **4 ou mais produtos** (`MIN_PRODUCTS_FOR_SECTIONS` em `lib/landing.ts`). Com menos, a vitrine já mostra os produtos.
- **Hero:** a cada carregamento sorteia um produto **com foto** (foto, nome e link para a página do produto). Sem produto com foto, mantém o bloco rosa.
- **"Em alta agora"** é um carrossel que desliza com o dedo, o mouse (arrastar) e as setas, sem repetir produto.
- **`/loja/[slug]`:** página do produto com galeria, preço, estoque e sacola. Slug inexistente ou produto oculto → 404. API fora do ar → estado de erro (nunca um 404 falso).
- **Galeria no painel:** até 8 fotos por produto; a primeira é a capa. Os cards da landing, da `/loja` e do "Em alta" levam à página do produto.
- Movimento: entrada suave das páginas e cards em cascata; `prefers-reduced-motion` desliga tudo.

## Estrutura

- `app/` — rotas (`/` landing, `/loja` listagem da API) e `globals.css` com os tokens do design system.
- `components/` — uma seção da landing por componente.
- `lib/settings.ts` — configurações da loja lidas da API (WhatsApp, telefone, Instagram, cidade). `lib/site.ts` guarda só os valores padrão de emergência.
- `lib/api.ts` — cliente da API, formatação de preço (centavos → R$) e vitrine com fallback.
- `lib/catalog.ts` — tipos e conteúdo estático da landing (não há mais produtos de exemplo).
- `public/logo-trendkids.webp` — logo atual (provisório, ver README do design system).

## Pendências antes de publicar

- Fotos reais (os blocos rosa-claro dizem qual foto entra em cada lugar).
- Newsletter ainda não envia para nenhum provedor (`components/Newsletter.tsx`, `onSubscribe`).
- Acompanhamento do pedido na tela (`/sacola`): o endpoint `POST /v1/orders/lookup` já existe na API.
- Tamanho e cor dos produtos: fora do escopo atual (produto simples, sem variantes).
- Verificação completa no navegador da vitrine (plano em `docs/superpowers/plans/2026-11-19-vitrine-detalhe-animacoes.md`, Task 7).
