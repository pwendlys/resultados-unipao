

## Adicionar Filtros de Categoria e Tipo na Categorização

### Análise de Impacto (não-quebra)

A função `filterTransactions` já recebe parâmetros opcionais e combina condições com AND. Vou apenas:
- Adicionar 2 novos parâmetros opcionais (`categoryFilter`, `typeFilter`) com default `'ALL'`
- Adicionar 2 novos estados em `Categorization.tsx`
- Adicionar 2 novos `<Select>` em `CategoryFilters.tsx`

Nada existente é alterado — todos os filtros antigos (conta, período, busca, não-categorizadas) continuam funcionando exatamente como hoje. Assinaturas das funções mantêm compatibilidade via parâmetros opcionais.

### Mudanças

**1. `src/components/categorization/utils/transactionFilters.ts`**

Adicionar dois parâmetros opcionais ao final da assinatura (mantém retrocompatibilidade):
```ts
categoryFilter: string = 'ALL',
typeFilter: 'ALL' | 'entrada' | 'saida' = 'ALL'
```

Adicionar duas condições AND ao filtro existente:
- `matchesCategory = categoryFilter === 'ALL' || transaction.category === categoryFilter`
- `matchesType = typeFilter === 'ALL' || transaction.type === typeFilter`

**2. `src/components/categorization/Categorization.tsx`**

Adicionar dois estados novos:
```ts
const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
const [typeFilter, setTypeFilter] = useState<'ALL' | 'entrada' | 'saida'>('ALL');
```

Passar ambos para `filterTransactions(...)` e para `<CategoryFilters>` como props.

**3. `src/components/categorization/CategoryFilters.tsx`**

Adicionar duas props opcionais e dois novos `<Select>` numa segunda linha do grid (para não quebrar o layout atual de 3 colunas):
- **Categoria**: opções = "Todas" + lista dinâmica vinda de `categories` (passada via prop)
- **Tipo**: opções = "Todos", "Entrada", "Saída"

Layout: criar uma segunda linha `grid grid-cols-1 md:grid-cols-2 gap-4` abaixo do grid existente, antes do checkbox de "não categorizadas".

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/categorization/utils/transactionFilters.ts` | +2 parâmetros opcionais, +2 condições AND |
| `src/components/categorization/Categorization.tsx` | +2 estados, +2 props passadas (categories também) |
| `src/components/categorization/CategoryFilters.tsx` | +2 props, +2 selects numa nova linha |

### O Que NÃO Muda

- Nenhuma assinatura de função existente quebra (parâmetros novos são opcionais)
- Filtros atuais (conta, período, busca descrição/valor, não-categorizadas) permanecem idênticos
- Paginação, seleção em massa, categorização individual: sem alterações
- Nenhuma mudança em hooks, banco de dados ou queries

