## Problema
No modal **Diligências** (`FiscalDiligencesModal`, usado por fiscais e tesoureiro) só aparecem: Transação, Motivo (observação da diligência), Marcado por, Data e Status. O campo **Observação do ADM** (`transactions.observacao` — onde o ADM esclarece o que é cada lançamento) não é exibido.

## Solução (aditiva)
Adicionar uma coluna **"Observação"** ao modal, lendo `transactions.observacao`. Mudança isolada em `FiscalDiligencesModal.tsx` — não altera hooks, RLS, fluxo de diligências, contagens 3/3 nem nada relacionado.

### Edits em `src/components/fiscal/FiscalDiligencesModal.tsx`
1. No `select` de `useReportTransactions`, incluir `observacao`:
   `.select('id, date, description, amount, type, observacao')`
2. Tipar o map com `observacao: string | null`.
3. No `diligenceEntries.map`, adicionar `observacaoAdm: tx?.observacao || ''`.
4. Na `<TableHeader>`, adicionar `<TableHead className="min-w-[180px]">Observação</TableHead>` entre "Motivo" e "Marcado por".
5. Na `<TableBody>`, adicionar célula correspondente exibindo `entry.observacaoAdm` (ou texto suave "—" se vazio) com `line-clamp-3 text-sm`.

## O que NÃO muda
- Hooks (`useTransactionDiligenceStatus`, `useReportTransactions` mantém mesma chave de cache).
- Tabela `transactions`, RLS, realtime.
- Fluxo de diligências, ack 3/3, painel fiscal, geração de PDF.
- Modal continua usado igualmente por fiscal e tesoureiro (ambos verão a observação).