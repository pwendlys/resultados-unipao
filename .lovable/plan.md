## Objetivo
Exibir o valor de **Juros** (campo `transactions.juros`) para os fiscais antes da aprovação, no modal de diligências do tesoureiro e no PDF do relatório fiscal — sem alterar nenhuma função/fluxo existente.

## Alterações (todas aditivas)

### 1. `src/hooks/useFiscalReviews.ts`
Adicionar `juros` no `select(...)` da query de `transactions` e no tipo `FiscalReview.transaction` (campo opcional `juros: number | null`). Nenhuma lógica muda — apenas um campo a mais é carregado.

### 2. `src/components/fiscal/FiscalReviewItem.tsx`
Adicionar uma exibição visual quando `transaction.juros > 0`, ao lado/abaixo do valor (R$), no formato:
`Juros: R$ XX,XX`
Apenas leitura. Sem mudar botões Aprovar/Divergente nem estado.

### 3. `src/components/fiscal/FiscalDiligencesModal.tsx`
Acrescentar uma coluna **"Juros"** na tabela (entre "Valor" e "Categoria"), exibindo `R$ X,XX` quando houver, ou `—`. Coluna puramente informativa para o tesoureiro.

### 4. `src/utils/fiscalPdfGenerator.ts`
- Na linha de cada transação na tabela principal: quando `transaction.juros > 0`, anexar `" (Juros: R$ X,XX)"` após o `amountStr` na mesma célula de Valor (sem mover colunas).
- Na seção **DILIGÊNCIAS REGISTRADAS**: adicionar uma linha extra abaixo de "Valor: ... | Confirmação: x/3" exibindo `Juros: R$ X,XX` apenas quando `juros > 0`, respeitando a paginação (`yPos > 280 → addPage`).

## O que NÃO muda
- Schema do banco, RLS, hooks de actions, ordem `entry_index`, contagem de aprovações, diligência 3/3, assinaturas, fluxo de PDF (geração/save/blob), layout das demais colunas, modal de observação fiscal, painel do tesoureiro fora do modal, navegação.

## Detalhe técnico
`juros` já existe em `transactions` (ver `integrations/supabase/types.ts`). Hoje a query de `useFiscalReviews` não o retorna — daí a invisibilidade. Carregá-lo no select propaga automaticamente para `FiscalReviewItem` (via `useFiscalReviews`) e para o `fiscalPdfGenerator` (via `review.transaction`). O `FiscalDiligencesModal` consome a mesma estrutura, então basta renderizar a coluna nova.
