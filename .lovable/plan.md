## Problema

No painel do **Fiscal** (`Relatórios para Revisão`), relatórios já finalizados pelo Tesoureiro continuam aparecendo como **"Aguardando Tesouraria" (90%)** — ex.: Cora Dez 25, Cora Nov 25, Mensalidades/Aporte/Boletos.

### Causa raiz

Consulta no banco mostra que os relatórios têm:
- `fiscal_report_signatures` = 3/3
- `treasurer_signatures` = 1 (tesoureiro já assinou)
- Porém `fiscal_reports.status = 'open'` e `pdf_url = NULL`

No painel do Tesoureiro (`useTreasurerReportsSummary`) já existe a lógica correta: um relatório é considerado **Finalizado** quando há assinatura do tesoureiro + 3/3 fiscais + diligências confirmadas, **mesmo sem `pdf_url` ou `status='finished'`**.

Mas em `FiscalReportsList.tsx` / `useReportsListStats.ts` o critério é apenas:
```ts
report.pdf_url || report.status === 'finished'
```
— que ignora a existência de `treasurer_signatures`. Por isso o card permanece em "Aguardando Tesouraria".

## Plano (cirúrgico, sem alterar funcionalidades existentes)

### 1. `src/hooks/useReportsListStats.ts` (aditivo)

Buscar também `treasurer_signatures` e expor `hasTreasurerSigned: boolean` por relatório:

```ts
export interface ReportListStats {
  signatureCount: number;
  diligenceCount: number;
  noChangeCount: number;
  hasTreasurerSigned: boolean; // NOVO
}
```

Adicionar uma query `.from('treasurer_signatures').select('report_id').in('report_id', reportIds)` e popular o flag. Sem alterar nada que já é retornado.

### 2. `src/components/fiscal/FiscalReportsList.tsx` (aditivo)

Em `computeReportProgress`, considerar **Finalizado** quando o tesoureiro assinou:

```ts
if (report.pdf_url || report.status === 'finished' || hasTreasurerSigned) {
  return { progress: 100, label: 'Finalizado', ... };
}
```

Passar `hasTreasurerSigned` (de `stats`) para a função. Também usar esse flag no indicador "Tesouraria: Sim/Não" para refletir corretamente.

## O que NÃO será alterado

- Estrutura/assinatura de hooks e componentes existentes.
- Lógica do painel do Tesoureiro (já correta).
- Fluxos de assinatura, diligências, geração de PDF, RLS, cache.
- Demais cálculos de progresso intermediário (10–89%).

## Resultado esperado

Os 9 relatórios que o tesoureiro já assinou passarão a aparecer no painel do fiscal como **"Finalizado" 100%** com **Tesouraria: Sim**, consistente com o painel do Tesoureiro.