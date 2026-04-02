

## Correção: Botão "Assinar como Tesoureiro" não aparece

### Causa Raiz

O hook `useTreasurerReportsSummary` busca **todas** as reviews de `fiscal_user_reviews` em uma única query sem paginação. O Supabase limita a 1000 linhas por padrão. A tabela tem ~2.856+ registros, então a maioria dos relatórios fica sem dados de reviews, resultando em `approvedTransactions = 0` e `pendingCount = 10`.

Como `canSignAsTreasurer` exige `pendingCount === 0`, o botão nunca aparece.

### Solução

Modificar **apenas** `src/hooks/useTreasurerReportsSummary.ts` para buscar as reviews com paginação, contornando o limite de 1000 linhas.

#### Arquivo: `src/hooks/useTreasurerReportsSummary.ts`

Criar uma função auxiliar `fetchAllRows` que busca em blocos de 1000 até esgotar os dados:

```typescript
async function fetchAllRows(table: string, select: string) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let from = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length < PAGE_SIZE) hasMore = false;
    allData = allData.concat(data || []);
    from += PAGE_SIZE;
  }
  
  return allData;
}
```

Substituir a query atual de `fiscal_user_reviews` (linhas 49-51) para usar essa função:

```typescript
// Antes:
const { data: allReviews, error: reviewsError } = await supabase
  .from('fiscal_user_reviews')
  .select('report_id, transaction_id, user_id, status, observation, diligence_ack, diligence_created_by');

// Depois:
const allReviews = await fetchAllRows(
  'fiscal_user_reviews',
  'report_id, transaction_id, user_id, status, observation, diligence_ack, diligence_created_by'
);
```

### O que NÃO será alterado
- Nenhuma outra funcionalidade, componente, ou hook
- A lógica de `canSignAsTreasurer`, `canGenerateFinal`, e todo o cálculo de métricas permanece idêntica
- Apenas a forma como os dados são buscados muda (paginação)

