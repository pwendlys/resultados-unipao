## Objetivo

Permitir que o ADM edite o campo "Observação" de uma transação **mesmo após ela já estar categorizada**, com a alteração refletida em tempo real nos painéis Fiscal e Tesoureiro — sem alterar nenhuma função existente (apenas adições/extensões locais).

## Mudanças propostas

### 1. Edição da observação após categorização (tela Categorização)

**`src/components/categorization/TransactionRow.tsx`** (alteração mínima e localizada)
- Hoje, quando `status === 'categorizado'`, a célula de observação renderiza apenas um `<span>` somente-leitura.
- Substituir esse `<span>` por um `<Input>` editável com auto-save no `onBlur` (ou Enter), chamando um novo callback `onObservationUpdate(transactionId, value)`.
- A categorização em si, o botão de categorizar, o badge "Categorizado", a categoria selecionada e a UI dos não-categorizados **não mudam**.

**`src/components/categorization/Categorization.tsx`** (adição de um handler novo)
- Adicionar nova função `handleObservationUpdate(id, observacao)` que chama `updateTransaction.mutateAsync({ id, observacao })` — **somente** o campo observação, sem mexer em `status` nem `category`.
- Passar essa função como nova prop `onObservationUpdate` para `TransactionRow`.
- Manter `handleCategorize` e `handleBulkCategorize` exatamente como estão.

Nenhuma mudança em `useSupabaseData` / `useTransactionsActions` — `updateTransaction` já aceita update parcial.

### 2. Atualização em tempo real nos painéis Fiscal e Tesoureiro

**`src/hooks/useFiscalReviews.ts`** (adição: efeito de Realtime, sem alterar a query atual)
- Adicionar um `useEffect` que cria uma subscrição Supabase Realtime ao canal de UPDATEs da tabela `transactions`.
- Quando chegar um UPDATE, chamar `queryClient.invalidateQueries({ queryKey: ['fiscal-reviews', fiscalReportId] })` para recarregar com a nova observação.
- O hook continua retornando exatamente o mesmo shape; o painel do Tesoureiro consome o mesmo hook → ambos atualizam automaticamente.
- Já existe `staleTime: 0` + botão "Atualizar" como fallback.

### 3. Migration leve para habilitar Realtime na tabela `transactions`

Sem alterar schema/colunas/RLS — apenas:
- `ALTER TABLE public.transactions REPLICA IDENTITY FULL;`
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;` (idempotente / com guard)

Isso permite que os eventos UPDATE cheguem ao cliente. Não afeta nenhuma função, trigger, política ou dado existente.

## O que NÃO muda

- Schema/colunas de `transactions`, RLS, triggers, edge functions
- Fluxo de categorização (individual e em massa)
- `useFiscalReports`, `useFiscalReviewsActions`, `useFiscalUserReviews`
- `FiscalReviewItem` / `FiscalReviewPanel` (já exibem `transaction.observacao` corretamente)
- Geração de PDF, assinaturas, despacho, painel do tesoureiro (consome os mesmos componentes)

## Resultado

- ADM pode editar a observação de qualquer transação categorizada direto na tabela.
- O save vai ao banco imediatamente.
- Painéis Fiscal e Tesoureiro abertos recebem o novo valor via Supabase Realtime sem precisar recarregar.