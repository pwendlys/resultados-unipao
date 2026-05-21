## Objetivo

Exibir as observações feitas pelo ADM na categorização das transações dentro do painel Fiscal (e consequentemente acessível ao Tesoureiro que também usa esses itens), tanto na listagem quanto na hora de aprovar/marcar como divergente.

Hoje a coluna `transactions.observacao` (preenchida na tela de Categorização pelo ADM) existe no banco, mas não é selecionada pela query do painel fiscal nem renderizada no item de revisão.

## Mudanças (somente additivas)

### 1. `src/hooks/useFiscalReviews.ts`
- Adicionar `observacao` no `select` do relacionamento `transaction:transactions (...)`.
- Adicionar `observacao: string | null` na interface `FiscalReview['transaction']`.

Nenhuma outra função/mutation é alterada.

### 2. `src/components/fiscal/FiscalReviewItem.tsx`
- Adicionar um bloco visual **somente quando** `transaction?.observacao` existir:
  - Um destaque discreto (ex.: caixa com borda azul/âmbar suave + ícone) com label "Observação do ADM:" e o texto.
  - Posicionado logo abaixo do valor/categoria (sempre visível, não escondido no expand), para que o fiscal veja antes de aprovar.
- Também repetir no bloco "Expanded Details" para manter consistência.

Nenhuma lógica de aprovação/divergência/diligência é tocada.

## O que NÃO muda

- Schema do banco, RLS, triggers.
- Hooks `useFiscalReports`, `useFiscalReviewsActions`, fluxo de assinatura, geração de PDF, painel do tesoureiro (ele consome os mesmos componentes/queries, então passa a ver a observação automaticamente).
- Tela de Categorização do ADM.
- Modal `FiscalObservationModal` (observação de divergência do fiscal — campo separado em `fiscal_reviews.observation`).

## Resultado

Fiscais e Tesoureiro passam a ver a observação do ADM em cada lançamento dentro do painel de revisão, sem qualquer alteração nos fluxos atuais.