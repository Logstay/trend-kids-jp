# Acompanhamento do pedido (`/pedido`) — Design

Data: 2026-11-20 · Status: **aprovado**

## Intenção e por quê

Quem fez um pedido no site precisa ver em que pé ele está (recebido, pagamento confirmado, enviado, entregue) sem precisar falar com a loja. A API já expõe a consulta (`POST /v1/orders/lookup`), mas o site não tem tela para isso.

## Objetivos

- Página `/pedido`: a pessoa informa o código (`TK…`) e o WhatsApp, e vê status, itens e total.
- Link para a página na confirmação do pedido (`CartView`) e no rodapé.
- Mensagens de erro iguais às da API: código ou telefone errados dão o mesmo "pedido não encontrado".

## Fora do escopo

Mudança na API; histórico de eventos do pedido; cancelamento pelo cliente; notificação; busca só pelo código (a API exige código e telefone).

## Abordagem escolhida

Página `/pedido` no Next (client component), chamando `POST /v1/orders/lookup` pelo proxy `/api`. Lógica pura em `lib/order-tracking.ts` (rótulos dos status, etapas, normalização e validação do código), testada com vitest. Alternativas descartadas: consulta por GET com telefone na URL (o telefone iria parar em log e histórico) e página só acessível pela URL (a pessoa não encontra).

## Desenho

- Formulário: código (aceita minúsculas e espaços; normalizado para maiúsculas) e WhatsApp.
- Resultado: código, rótulo do status, etapas (recebido → pagamento confirmado → enviado → entregue), itens com quantidade e total, frete e total. Pedido cancelado mostra "Cancelado" no lugar das etapas.
- Erro de rede ou API fora do ar: mensagem de erro com "Tentar de novo", nunca "pedido não encontrado".
- Query `?codigo=TK…` pré-preenche o campo (usado pelo link da confirmação).

## Decisões minhas (podem ser corrigidas)

1. Rota `/pedido` (curta, em português).
2. Código inválido no formato (`TK` + 8 caracteres do alfabeto sem 0/O/1/I/L) é recusado no front antes de chamar a API.
3. Status desconhecido mostra "Status em atualização", sem quebrar.

## O que fica para o construtor

Textos e estilos (tokens de `app/globals.css`); layout em duas colunas só se couber; testes de navegador ficam para a verificação final.
