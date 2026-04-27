## Selecionar Todas as Transações (Todas as Páginas)

### Problema

Hoje o checkbox "Selecionar todos" do cabeçalho da tabela seleciona apenas as 10 transações da página atual. Quando há 155 resultados filtrados, o usuário precisa repetir a operação 16 vezes para categorizar tudo de uma vez.

### Solução (sem quebrar nada)

Adicionar uma **faixa contextual** que aparece logo acima/dentro da `BulkActionsBar` quando o usuário marcar o checkbox "selecionar todos" da página. A faixa oferece um botão extra:

> **"10 selecionadas nesta página. Selecionar todas as 155 transações filtradas?"** [Selecionar todas as 155]

Ao clicar, o sistema marca o conjunto completo de IDs filtrados (todas as páginas). Todo o resto do fluxo de bulk categorize permanece igual — `handleBulkCategorize` já recebe `Array.from(selectedTransactions)` e chama `bulkUpdateTransactions.mutateAsync(updates)`, então funciona automaticamente para 155 itens.

### Análise de Não-Quebra

- `handleSelectAll(selected)` continua igual (seleciona apenas a página atual)
- `handleSelectTransaction`, paginação, filtros, categorização individual: **sem alteração**
- `bulkUpdateTransactions.mutateAsync` já aceita arrays grandes (não há limite no código)
- `TransactionTable` continua recebendo o `Set` igual; o cabeçalho fica `checked` quando todos da página estão marcados (comportamento atual preservado)
- Nenhuma assinatura de função existente muda; nenhuma query/banco/hook é alterado

### Mudanças

**1. `src/components/categorization/Categorization.tsx`**
- Adicionar handler novo `handleSelectAllFiltered()` que faz `setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)))`
- Passar `filteredCount={filteredTransactions.length}` e `onSelectAllFiltered` para `BulkActionsBar`
- Não toca em `handleSelectAll` nem em nada existente

**2. `src/components/categorization/BulkActionsBar.tsx`**
- Adicionar 2 props opcionais: `filteredCount?: number` e `onSelectAllFiltered?: () => void`
- Quando `selectedCount > 0 && selectedCount < filteredCount`, mostrar uma linha extra acima dos botões existentes:
  ```
  [info icon] 10 selecionadas nesta página. [Selecionar todas as 155 transações filtradas]
  ```
- Quando `selectedCount === filteredCount && filteredCount > itemsPerPage`, mostrar texto "Todas as 155 transações filtradas selecionadas"
- Layout existente (badge + select + botão Categorizar + Limpar) permanece **idêntico**

### Fluxo Final do Usuário

1. Aplica filtros (ex.: 155 transações)
2. Marca checkbox do cabeçalho → seleciona 10 da página (igual hoje)
3. **NOVO**: aparece faixa "Selecionar todas as 155 transações filtradas?" → clica
4. Seleciona categoria no dropdown existente → "Categorizar Selecionadas"
5. Todas as 155 são categorizadas em massa (usando o `bulkUpdateTransactions` atual)

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/categorization/Categorization.tsx` | +1 handler, +2 props passadas para `BulkActionsBar` |
| `src/components/categorization/BulkActionsBar.tsx` | +2 props opcionais, +1 linha de UI condicional |

### O Que NÃO Muda

- `TransactionTable` e seu checkbox de cabeçalho: **sem alteração**
- `handleSelectAll`, `handleSelectTransaction`, paginação: **sem alteração**
- `handleBulkCategorize` e `bulkUpdateTransactions`: **sem alteração** (já suportam N itens)
- Filtros (categoria, tipo, conta, período, busca): **sem alteração**
- Banco de dados, hooks, queries: **sem alteração**
