# Trend Kids JP

Site da Trend Kids JP (Crocs infantis, João Pessoa). Next.js 15 (App Router) + TypeScript.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run export     # site estático em ./out (qualquer hospedagem)
npm run build      # build normal do Next.js
```

## Estrutura

- `app/` — rotas (`/` landing, `/loja` provisória) e `globals.css` com os tokens do design system.
- `components/` — uma seção da landing por componente.
- `lib/site.ts` — **dados da loja** (WhatsApp, Instagram, preço inicial). Preencha antes de publicar.
- `lib/catalog.ts` — vitrines da landing (hoje com placeholders; virão da API do back).
- `public/logo-trendkids.webp` — logo atual (provisório, ver README do design system).

## Pendências antes de publicar

- Fotos reais (os blocos rosa-claro dizem qual foto entra em cada lugar).
- Preços (`R$ [PREÇO]`), WhatsApp e Instagram em `lib/site.ts`.
- Newsletter ainda não envia para nenhum provedor (`components/Newsletter.tsx`).
- Loja (catálogo, sacola) e painel: protótipos no canvas, ainda não portados.
