## Problema

No "Relatório Operacional Personalizado" (módulo `CustomReports`), o preview mostra **0 transações** ao filtrar **Cora + MENSALIDADES E TX ADM** em **janeiro/2026**, mesmo havendo 184 transações dessas contas em janeiro no banco (Mensalidade, Taxa Administrativa, Conta Sicoob Mensalidades e Tx Adm, Tranf. Cora TX ADM e Mensalidade).

## Causa raiz (confirmada por console + DB)

O hook `useTransactionsByAccount('ALL')` (em `src/hooks/useSupabaseData.ts`) usa `.range(0, 19999)` mas o PostgREST do projeto está retornando apenas **1000 linhas** (limite efetivo do servidor). O console confirma: `"Transações recebidas do hook: 1000"`.

Como a query ordena por `created_at desc`, as 1000 transações mais recentes são todas de **março/2026** (`12/03/2026, 17/03/2026...`). Resultado: ao filtrar por janeiro/2026, sobra **zero** — embora o banco contenha 6.123 transações categorizadas, incluindo as de janeiro.

Já existe no projeto um hook que resolve exatamente isso para outro módulo: `useAllCategorizedTransactions` (em `src/hooks/useAllCategorizedTransactions.ts`), que faz paginação automática de 1000 em 1000 e traz tudo.

## Solução (sem refatorar nada existente)

Criar um hook irmão **novo e dedicado** para o módulo de relatórios personalizados, que pagina todas as transações (não apenas as categorizadas, pois CustomReports filtra por `status === 'categorizado'` no final mas precisa de todas para os filtros intermediários funcionarem corretamente).

### Mudanças

**1. Novo hook `src/hooks/useAllTransactions.ts`** (criar)
- Mesma estratégia de paginação do `useAllCategorizedTransactions`
- Busca **todas** as transações (sem filtro de status), ordenadas por `created_at desc`
- Loop com `range(from, to)` em páginas de 1000 até o servidor retornar menos
- `queryKey: ['all-transactions-paginated']`, `staleTime: 5min`
- Retorna o mesmo shape que o hook atual (`Transaction[]`)

**2. `src/components/custom-reports/CustomReports.tsx`** (1 linha alterada)
- Trocar `useTransactionsByAccount('ALL')` por `useAllTransactions()`
- Nenhuma outra lógica muda (filtros, totais, datas, categorias permanecem idênticos)

### O que NÃO muda

- `useTransactionsByAccount` continua existindo e sendo usado pelos demais módulos (Reports, Dashboard, Categorization, etc.) — **zero impacto** neles.
- `useAllCategorizedTransactions` continua exclusivo do "Relatórios Enviar".
- Lógica de filtros (`getFilteredData`, `parseTransactionDate`, normalização de datas) intacta.
- PDF generator, preview, envio para cooperado/fiscal: sem alteração.
- Banco de dados, RLS, edge functions: sem alteração.

## Resultado esperado

Após a mudança, ao filtrar Cora + MENSALIDADES E TX ADM em 01/01/2026–31/01/2026, o preview vai exibir as 184 transações de janeiro corretamente, com totais de Receitas/Despesas, Resultado Líquido e categorias preenchidas.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/hooks/useAllTransactions.ts` | **Novo** — paginação automática até esgotar |
| `src/components/custom-reports/CustomReports.tsx` | 1 linha: trocar hook |