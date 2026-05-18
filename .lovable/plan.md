## Problema

Hoje, ao usar "Categorizar Selecionadas" na barra de ações em massa, o sistema salva apenas `category` e `status`. O texto digitado no campo "Observação" de cada linha fica apenas no estado local de `TransactionRow` e é descartado — só é persistido quando o usuário clica no botão "Categorizar" individual da linha.

## Objetivo

Garantir que, ao categorizar várias transações de uma só vez, as observações digitadas em cada linha selecionada também sejam salvas — sem alterar o fluxo individual atual, sem renomear funções e sem mexer em outras telas.

## Mudanças (mínimas e aditivas)

### 1. `src/components/categorization/TransactionRow.tsx`
- Adicionar duas props **opcionais**: `observationValue?: string` e `onObservationChange?: (transactionId, value) => void`.
- Se vierem definidas, o `Input` de observação passa a ser controlado pelo pai (lifting state). Caso contrário, mantém o comportamento atual com `useState` local — preserva 100% do fluxo individual.
- A função `handleCategorize` continua usando o valor atual (controlado ou local) — sem alteração de assinatura externa.

### 2. `src/components/categorization/TransactionTable.tsx`
- Adicionar props opcionais `observations?: Record<string,string>` e `onObservationChange?`, repassando para cada `TransactionRow`. Sem mudanças na renderização.

### 3. `src/components/categorization/Categorization.tsx`
- Novo estado: `const [observations, setObservations] = useState<Record<string,string>>({})`.
- Novo handler `handleObservationChange(id, value)` que atualiza o objeto.
- Passar `observations` e `handleObservationChange` para `TransactionTable`.
- Em `handleBulkCategorize(category)`: montar cada update incluindo `observacao: observations[id]` apenas quando houver valor não vazio (`trim()`). Limpar o map dos ids processados ao final.
- `handleCategorize` individual continua intacto (já envia `observacao`).

### 4. `src/hooks/useSupabaseData.ts` — `bulkUpdateTransactions`
- Ampliar o tipo do payload para aceitar campo opcional `observacao?: string | null`.
- No `.update(...)`, montar o objeto condicionalmente: se `update.observacao` estiver presente, incluir; senão, manter exatamente o mesmo `{ category, status }` de hoje.
- Nenhuma chamada existente quebra (campo é opcional e o comportamento default é idêntico).

## O que NÃO muda
- Assinaturas públicas de `handleCategorize`, `onCategorize`, `onBulkCategorize`, `bulkUpdateTransactions` (apenas extensão opcional).
- BulkActionsBar permanece igual.
- Paginação, filtros, seleção (incluindo "selecionar todas as filtradas"), RLS, PDFs, relatórios — sem alteração.
- Categorização individual continua salvando observação como hoje.

## Resultado esperado
Após digitar observações em várias linhas, selecionar essas linhas e clicar em "Categorizar Selecionadas", as observações digitadas são persistidas junto com a categoria no Supabase, aparecendo no painel e nos PDFs (que já leem `observacao`).