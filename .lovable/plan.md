

## Ajuste de Layout Mobile - Painel Fiscal

### Problema
Na viewport de 390px, os botões de ação ("Aprovar Todos Pendentes", "Exportar PDF") e os botões dentro de cada card de transação ("Divergente", "Aprovar") estão saindo da tela ou ficando apertados.

### Mudanças (apenas CSS/layout, zero alteração de lógica)

#### 1. `src/components/fiscal/FiscalReviewPanel.tsx` - Botões de ação superiores (linhas 498-542)

Trocar `flex flex-wrap gap-2` por layout em coluna no mobile:
- `flex flex-col sm:flex-row sm:flex-wrap gap-2`
- Botões com `w-full sm:w-auto` para ocupar largura total no mobile

#### 2. `src/components/fiscal/FiscalReviewItem.tsx` - Botões de ação do card (linhas 231-304)

Ajustar a row de ações:
- Trocar `flex items-center justify-between` por `flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2`
- Os botões "Divergente" e "Aprovar" ficam em `flex gap-2` com tamanho `flex-1 sm:flex-none` no mobile
- O botão "Confirmar Diligência" também ganha `w-full sm:w-auto`
- Texto dos botões com `text-xs sm:text-sm` para caber melhor

### Arquivos modificados
| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/components/fiscal/FiscalReviewPanel.tsx` | Classes CSS dos botões de ação |
| `src/components/fiscal/FiscalReviewItem.tsx` | Classes CSS da row de ações |

### O que NÃO será alterado
- Nenhuma funcionalidade, handler, lógica ou prop
- Nenhum outro componente ou arquivo

