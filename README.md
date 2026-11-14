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

## Back-end (API em Go)

Os produtos vêm da API (`trend-kids-api`, repositório separado). Defina a URL no ambiente:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080   # padrão
```

- Landing: busca 8 produtos; **API vazia = sem produtos**; **API fora do ar = placeholders** de `lib/catalog.ts`.
- `/loja?categoria=Classic`: lista da API; com a API fora do ar mostra um aviso e o WhatsApp.

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

## Painel (`/admin`)

Login, lista de produtos, cadastro, ocultar/mostrar na loja e ajuste de estoque (entrada/saída com motivo).

- O site repassa `/api/*` para a API (`next.config.ts`), então o cookie de sessão nasce na origem do site.
  O navegador nunca fala direto com a API do painel e o JavaScript não enxerga o cookie (HttpOnly).
- `/admin` é renderizada no servidor: sem sessão válida redireciona para `/admin/login`.
- **Atrás do proxy, a API precisa de `TRUSTED_PROXIES`** com o IP do servidor do site; sem isso o limite
  de tentativas de login vira global (um atacante travaria o dono). Veja o `.env.example` da API.
- O dono é criado na API: `go run ./cmd/createadmin -email ...` (não existe cadastro público).

## Estrutura

- `app/` — rotas (`/` landing, `/loja` listagem da API) e `globals.css` com os tokens do design system.
- `components/` — uma seção da landing por componente.
- `lib/settings.ts` — configurações da loja lidas da API (WhatsApp, telefone, Instagram, cidade). `lib/site.ts` guarda só os valores padrão de emergência.
- `lib/api.ts` — cliente da API, formatação de preço (centavos → R$) e vitrine com fallback.
- `lib/catalog.ts` — tipos e placeholders usados só se a API estiver fora do ar.
- `public/logo-trendkids.webp` — logo atual (provisório, ver README do design system).

## Pendências antes de publicar

- Fotos reais (os blocos rosa-claro dizem qual foto entra em cada lugar).
- Preços (`R$ [PREÇO]`), WhatsApp e Instagram em `lib/site.ts`.
- Newsletter ainda não envia para nenhum provedor (`components/Newsletter.tsx`).
- Loja: falta sacola, tamanho e finalização pelo WhatsApp (F1). Painel: não iniciado.
