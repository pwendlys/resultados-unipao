

## Correção: Relatórios não aparecem na ATA

### Causa Raiz

Todos os 12 relatórios no banco têm `status = 'open'`. O label "Concluído" exibido na "Área Fiscal" e no painel do Tesoureiro é **derivado em tempo real** a partir de métricas (pending_count=0, signatureCount>=3, etc.) — nunca é gravado na coluna `status`.

O módulo ATA filtra com `r.status === 'finished'`, que nunca retorna resultados.

### Solução

Em vez de filtrar pelo campo `status`, o módulo ATA deve usar a mesma lógica derivada: buscar o summary de cada relatório (via `useTreasurerReportsSummary`) e considerar "concluído" aqueles onde `isFinished === true` OU `(pendingTransactions === 0 && signatureCount >= 3 && allDiligencesConfirmed)`.

### Alteração: `MeetingMinutesForm.tsx`

1. Importar `useTreasurerReportsSummary` e `TreasurerReportSummary`
2. Substituir o filtro `r.status === 'finished'` por lógica derivada:
   - Para cada relatório em `allReports`, verificar se o summary correspondente indica conclusão
   - Um relatório é "concluído" se: `summary.isFinished === true` OU `(summary.pendingTransactions === 0 && summary.signatureCount >= 3 && summary.allDiligencesConfirmed)` OU `report.status === 'finished'` (fallback)
3. Mostrar na lista cada relatório com: titulo, competencia, account_type
4. Adicionar estado de loading enquanto o summary carrega
5. Quando nenhum relatório concluído for encontrado, mostrar mensagem com o total de relatórios encontrados e quantos estão "em andamento" para ajudar o debug

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|--------|
| `MeetingMinutesForm.tsx` | Importar hook de summary, derivar status "concluído" em vez de filtrar por `status === 'finished'` |

### O que NAO sera alterado
- Nenhum outro componente, hook, ou utilitario
- Nenhuma tabela ou RLS
- A logica de derivacao de status no Tesoureiro/Fiscal permanece identica

