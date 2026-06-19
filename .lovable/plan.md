## Problema
No mobile/tablet, o conteúdo da tabela do modal **Diligências** ultrapassa a largura da tela (textos "Descrição incomple...", coluna Status cortada). Hoje a `ScrollArea` rola só verticalmente — não há scroll horizontal. Faltam também as colunas Observação/Marcado por/Data/Status, escondidas no overflow.

## Solução (aditiva, somente UI)
Mudança isolada em `src/components/fiscal/FiscalDiligencesModal.tsx`. Sem tocar em dados, hooks, queries ou colunas.

### Edits
1. **DialogContent**: aumentar largura máxima e prever overflow:
   - `className="max-w-5xl w-[95vw] max-h-[85vh] flex flex-col"`
2. **ScrollArea vertical** já existe; envolver a `<Table>` em um wrapper com scroll horizontal:
   ```tsx
   <ScrollArea className="h-[500px] max-h-[60vh] w-full">
     <div className="min-w-[900px]">
       <Table>…</Table>
     </div>
     <ScrollBar orientation="horizontal" />
   </ScrollArea>
   ```
   - Importar `ScrollBar` de `@/components/ui/scroll-area`.
   - O `min-w-[900px]` força a tabela a manter a largura natural; o `ScrollBar horizontal` permite arrastar para o lado tanto no desktop quanto no mobile (touch).
3. Manter `min-w-[...]` em cada `<TableHead>` (já existe) para garantir colunas legíveis.
4. Remover `line-clamp-3` das células de texto? **Não** — manter, apenas o usuário pode arrastar para ver tudo (e o tooltip já vem do `line-clamp`). Sem alteração nas células.
5. Header do diálogo: nada muda.

## O que NÃO muda
- Dados, hooks `useTransactionDiligenceStatus` / `useReportTransactions`.
- Colunas, ordem, formato dos campos.
- Fluxo de diligências, contagem 3/3, ações.
- Nenhum outro modal/componente.

## Resultado
- Desktop: modal mais largo (até `max-w-5xl`), todas as colunas visíveis; se faltar largura, scroll horizontal aparece.
- Mobile/tablet: usuário arrasta a tabela lateralmente (touch ou barra) e vê Transação, Motivo, Observação, Marcado por, Data e Status integralmente.