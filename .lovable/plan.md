

## Progress 90%/100% + Visual Improvements for FiscalReportsList

### What Changes

**New progress logic** replacing the current broken calculation, plus a visual refresh of the report cards.

### Progress Rules

| Condition | Progress | Status Label |
|-----------|----------|-------------|
| `pdf_url` exists OR `status === 'finished'` | **100%** | Finalizado |
| `signatureCount >= 3` (no final PDF yet) | **90%** | Aguardando Tesouraria |
| Otherwise | **0-89%** based on review + signatures | Em Revisão |

Formula for "in progress":
```
reviewed = total_entries - pending_count
base = floor((reviewed / total_entries) * 80)
progress = min(base + signatureCount * 3, 89)
```

### Data Sources (all already available)

- `report.total_entries`, `report.pending_count`, `report.approved_count` -- from `useFiscalReports`
- `report.pdf_url`, `report.status` -- from `useFiscalReports`
- `signatureCount` -- from `useReportsListStats`
- `diligenceCount` -- from `useReportsListStats`

No new queries or database changes needed.

### Files Modified

| File | Change |
|------|--------|
| `src/components/fiscal/FiscalReportsList.tsx` | Replace `getProgressPercentage` with new `computeReportProgress` function; update `getStatusInfo` to use 3-tier logic; redesign card layout with labeled KPI chips, color-coded progress bar, prominent "Abrir" CTA button, and "Tesouraria: PDF Sim/Nao" indicator |

### UI Card Layout (new structure)

```text
+----------------------------------------------------------+
| [Title]                          [Badge: status label]   |
| Calendar icon  Competencia  |  Building icon  Tipo       |
|                                                          |
| ✅ Aprovadas: X  ⚠️ Diligencias: X  ⏳ Pendentes: X     |
| ✍️ Fiscais: X/3  📄 Tesouraria: Sim/Nao                  |
|                                                          |
| [===========progress bar===========] 90%  [Abrir →]      |
| Em Revisão / Aguardando Tesouraria / Finalizado          |
+----------------------------------------------------------+
```

Key visual changes:
- KPI chips with labels (not just icons + numbers)
- Progress bar color: green at 100%, amber at 90%, blue otherwise
- Status sub-label below the progress bar
- "Abrir" button replaces the subtle arrow icon
- Treasurer PDF indicator added as a new KPI chip

