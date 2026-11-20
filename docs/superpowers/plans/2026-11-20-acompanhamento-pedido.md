# Acompanhamento do pedido (`/pedido`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cliente informa o código do pedido (TK…) e o WhatsApp e vê status, itens e total, com links para essa página na confirmação e no rodapé.

**Architecture:** Lógica pura (rótulos, etapas, normalização e validação do código) em `lib/order-tracking.ts`, testada com vitest. Função `lookupOrder` no mesmo arquivo chama `apiRequest` (de `lib/admin.ts`, que já cuida de erros). Página `/pedido` (servidor) só lê `?codigo=` e entrega ao componente cliente `OrderTracking`, que faz o formulário.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-acompanhamento-pedido-design.md`

## Global Constraints

- Texto da interface em pt-BR; cores e raios só pelos tokens de `app/globals.css`.
- Rodar testes com `npm test` e tipos com `./node_modules/.bin/tsc --noEmit` (nunca `npx`).
- Endpoint: `POST /v1/orders/lookup` com body `{ "code": string, "phone": string }`; resposta é `ApiOrder` (`lib/api.ts`). Erro 404 vira `ApiError` com a mensagem da API ("pedido não encontrado").
- Código: `TK` + 8 caracteres do alfabeto `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (sem 0, O, 1, I, L). Normalização: `trim()` + maiúsculas.
- Status da API: `new`, `paid`, `shipped`, `delivered`, `cancelled`.
- `git add` só dos arquivos listados na tarefa, nunca `-A`. Não commitar sem pedido: os passos de commit ficam como comando sugerido.

## Review Focus

1. Código com minúsculas, espaços em volta ou sem o `TK` (`" tkab cd2345 "`): aceito após normalizar, ou recusado com mensagem clara, nunca enviado cru.
2. Código com caractere proibido (`TK0OIL1234`): recusado antes de chamar a API.
3. Telefone com máscara (`(83) 99999-1234`): enviado sem erro; a API normaliza.
4. Erro de rede ou API fora do ar: mensagem de erro com "Tentar de novo", nunca "pedido não encontrado".
5. Pedido cancelado: mostra "Cancelado" no lugar das etapas.

---

### Task 1: Lógica pura do acompanhamento

**Files:**
- Create: `lib/order-tracking.ts`
- Test: `lib/order-tracking.test.ts`

**Interfaces:**
- Produces (todas em `lib/order-tracking.ts`):
  - `orderStatusLabel(status: string): string`
  - `orderSteps: readonly { status: "new" | "paid" | "shipped" | "delivered"; label: string }[]` (rótulos: "Recebido", "Pagamento confirmado", "Enviado", "Entregue")
  - `orderProgress(status: string): number` (índice em `orderSteps`; `-1` para `cancelled` e status desconhecido)
  - `normalizeOrderCode(raw: string): string` (`trim` + maiúsculas)
  - `isValidOrderCode(code: string): boolean` (regex `^TK[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$` sobre o código já normalizado)
  - `parseCodeParam(value: string | string[] | undefined): string` (primeiro valor, ou `""`; normalizado)

- [ ] **Step 1: Escrever os testes que falham** em `lib/order-tracking.test.ts`:
  - `orderStatusLabel("new")` → `"Recebido"`; `"paid"` → `"Pagamento confirmado"`; `"shipped"` → `"Enviado"`; `"delivered"` → `"Entregue"`; `"cancelled"` → `"Cancelado"`; `"xyz"` → `"Status em atualização"`.
  - `orderSteps.map(s => s.label)` é `["Recebido","Pagamento confirmado","Enviado","Entregue"]`.
  - `orderProgress("new")` → `0`; `"delivered"` → `3`; `"cancelled"` → `-1`; `"xyz"` → `-1`.
  - `normalizeOrderCode("  tkabcd2345 ")` → `"TKABCD2345"`.
  - `isValidOrderCode("TKABCD2345")` → `true`; `"TKABCD234"` (7) → `false`; `"TKABCD23450"` (9) → `false`; `"TK0OIL1234"` → `false`; `"XXABCD2345"` → `false`; `""` → `false`.
  - `parseCodeParam(undefined)` → `""`; `"tkabcd2345"` → `"TKABCD2345"`; `["tkabcd2345","x"]` → `"TKABCD2345"`; `[]` → `""`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- lib/order-tracking.test.ts`
Expected: FAIL (módulo `./order-tracking` inexistente).

- [ ] **Step 3: Implementar `lib/order-tracking.ts`** com as assinaturas acima. Não importa nada além de tipos; `lookupOrder` entra na Task 2. A regex de código vive numa constante exportada.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- lib/order-tracking.test.ts` → PASS.

- [ ] **Step 5: Commit (sugerido)**

```bash
git add lib/order-tracking.ts lib/order-tracking.test.ts
git commit -m "feat: lógica do acompanhamento do pedido (rótulos, etapas, código)"
```

---

### Task 2: Cliente da consulta

**Files:**
- Modify: `lib/order-tracking.ts`

**Interfaces:**
- Consumes: `apiRequest` de `lib/admin.ts`; `ApiOrder` de `lib/api.ts`; `isValidOrderCode`, `normalizeOrderCode` (Task 1).
- Produces: `lookupOrder(code: string, phone: string): Promise<ApiOrder>`.

- [ ] **Step 1: Implementar `lookupOrder`** em `lib/order-tracking.ts`: normaliza o código, chama `apiRequest<ApiOrder>("POST", "/v1/orders/lookup", { code, phone })` e lança `Error("Código inválido")` antes da chamada se `isValidOrderCode` for `false`. Sem teste unitário: a função é uma linha de composição; a validação já está coberta na Task 1 e o fluxo completo é verificado na Task 5.

- [ ] **Step 2: Verificar tipos**

Run: `./node_modules/.bin/tsc --noEmit` → sem erros.

- [ ] **Step 3: Commit (sugerido)**

```bash
git add lib/order-tracking.ts
git commit -m "feat: cliente da consulta de pedido (POST /v1/orders/lookup)"
```

---

### Task 3: Página `/pedido` e formulário

**Files:**
- Create: `app/pedido/page.tsx`, `components/OrderTracking.tsx`
- Modify: `app/globals.css` (classes `.tracking`, `.tracking__steps`, `.tracking__step`, `.tracking__step--done`, `.tracking__step--current`)

**Interfaces:**
- Consumes: `lookupOrder`, `orderSteps`, `orderProgress`, `orderStatusLabel`, `normalizeOrderCode`, `isValidOrderCode`, `parseCodeParam` (Tasks 1–2); `formatPrice`, `ApiOrder` (`lib/api.ts`); `Header`, `Footer`, `EmptyState` (componentes existentes).
- Produces: `OrderTracking({ initialCode }: { initialCode: string })` (client); `app/pedido/page.tsx` com `searchParams: Promise<{ codigo?: string | string[] }>` (Next 15).

- [ ] **Step 1: `app/pedido/page.tsx`** (servidor): `const code = parseCodeParam((await searchParams).codigo)`; renderiza `Header`, `<main className="container">` com título "Acompanhar pedido", `<OrderTracking initialCode={code} />` e `Footer`. `metadata` com `robots: { index: false, follow: false }`.

- [ ] **Step 2: `components/OrderTracking.tsx`** (`"use client"`): estado `code` (começa em `initialCode`), `phone`, `order`, `error`, `loading`. Formulário com `<label>` para código (`id="code"`, `autoComplete="off"`, `maxLength` 12) e WhatsApp (`id="phone"`, `inputMode="tel"`, `autoComplete="tel"`). Submit: `e.preventDefault()`; se `loading`, retorna; se `!isValidOrderCode(normalizeOrderCode(code))` mostra "Código no formato TK… (são 10 caracteres)" e não chama a API; senão chama `lookupOrder`, guarda o resultado ou o erro (`error.message`; erro sem `ApiError` vira "Não conseguimos consultar agora. Tente de novo."). Resultado: código, `orderStatusLabel(order.status)`, lista de etapas (`orderSteps`, com `--done` até `orderProgress` e `--current` no índice atual; cancelado sem etapas, só o rótulo "Cancelado"), itens (`quantity`x `name`, `formatPrice(total_cents)`), subtotal, frete (só se > 0), total. Mensagem de erro com `role="alert"` e botão de nova tentativa que reenvia.

- [ ] **Step 3: Estilos** em `app/globals.css` com os tokens existentes (`--tinta`, `--branco`, `--radius-sm`, `--azul-escuro`). Etapas em lista horizontal no desktop e vertical no celular (≤ 640 px); foco visível `outline: 3px solid var(--azul-escuro)`; sem rolagem horizontal.

- [ ] **Step 4: Verificar**

Run: `./node_modules/.bin/tsc --noEmit && npm test` → sem erros e suíte verde. Depois `npm run build` deve listar `/pedido` como rota.

- [ ] **Step 5: Commit (sugerido)**

```bash
git add app/pedido/page.tsx components/OrderTracking.tsx app/globals.css
git commit -m "feat: página /pedido com formulário e status do pedido"
```

---

### Task 4: Links para `/pedido`

**Files:**
- Modify: `lib/nav.ts`, `lib/nav.test.ts`, `components/cart/CartView.tsx`

**Interfaces:**
- Consumes: `footerLinks` (`lib/nav.ts`).
- Produces: `footerLinks` ganha `{ label: "Acompanhar pedido", href: "/pedido" }`, logo após "Loja".

- [ ] **Step 1: Teste primeiro**: em `lib/nav.test.ts`, `footerLinks.map(l => l.label)` deve ser `["Loja","Acompanhar pedido","Nossa história","Guia de tamanhos e trocas"]`. Rodar `npm test -- lib/nav.test.ts` → FAIL.

- [ ] **Step 2: Implementar**: adicionar o item em `footerLinks` (`lib/nav.ts`). Rodar de novo → PASS.

- [ ] **Step 3: Link na confirmação**: em `CartView.tsx`, função `Confirmation`, depois do texto "Seu código é…", adicionar `<Link href={`/pedido?codigo=${encodeURIComponent(order.code)}`} className="link-btn">Acompanhar este pedido</Link>`. `Link` já está importado no arquivo.

- [ ] **Step 4: Verificar**: `./node_modules/.bin/tsc --noEmit && npm test` → verde.

- [ ] **Step 5: Commit (sugerido)**

```bash
git add lib/nav.ts lib/nav.test.ts components/cart/CartView.tsx
git commit -m "feat: links para o acompanhamento do pedido (confirmação e rodapé)"
```

---

### Task 5: Verificação final

**Files:** nenhum arquivo de produto.

- [ ] **Step 1: Suíte e tipos**: `./node_modules/.bin/tsc --noEmit && npm test && npm run build`. Esperado: sem erros, todas as suítes passando, rotas `/pedido` e `/loja/[slug]` listadas no build.

- [ ] **Step 2: Fluxo real (se a API e o banco estiverem de pé)**: com a API local, consultar um pedido existente pelo `curl -X POST localhost:8080/v1/orders/lookup` e comparar com a tela. Se não houver ambiente, registrar isso no relatório final em vez de declarar a tela verificada.

- [ ] **Step 3: Relatório**: listar o que foi verificado por comando e o que ficou só por leitura (navegador, celular, teclado).
