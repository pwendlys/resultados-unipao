

## Correção: Assinaturas não aparecem no PDF final

### Problemas Identificados

**1. PDF armazenado sem assinaturas**: O PDF final já foi gerado e armazenado no Storage provavelmente antes da correção de paginação (que fazia `pendingCount` ficar errado). Uma vez gerado (`hasFinalPdf = true`), não há como regenerar — o botão "Gerar PDF" desaparece e "Download" apenas abre o PDF antigo (sem assinaturas).

**2. Sem opção de regenerar**: O código na linha 579 usa `{!hasFinalPdf && (...)}`, escondendo completamente o botão de gerar quando já existe um PDF. Não há forma de corrigir um PDF defeituoso.

**3. Export do Fiscal incompleto**: No `FiscalReviewPanel.tsx` linha 392, `generateFiscalPDF` é chamado sem `treasurerSignature` e `profiles`, então o export do fiscal também gera PDF sem assinaturas.

### Solução (2 arquivos, sem alterar lógica existente)

#### 1. `src/components/treasurer/TreasurerFiscalArea.tsx`

Adicionar botão "Regerar PDF" quando `hasFinalPdf` é true e todas as condições estão satisfeitas. Isso permite ao tesoureiro regenerar o PDF corrigido:

- Onde hoje mostra `Badge "PDF Gerado"` (linha 613-618), adicionar ao lado um botão "Regerar" que chama a mesma função `handleGenerateFinalPDF`
- Modificar `canGenerateFinal` para remover a condição `&& !hasFinalPdf`, pois a regeneração usa a mesma lógica
- O `handleGenerateFinalPDF` já faz `upsert: true` no upload, então sobrescreve o PDF anterior

#### 2. `src/components/fiscal/FiscalReviewPanel.tsx`

Na linha 392, passar os parâmetros faltantes para que o export do fiscal também inclua assinaturas quando disponíveis:

```typescript
// Antes:
generateFiscalPDF(report, reviews, signatures, diligenceStatus);

// Depois:
generateFiscalPDF(report, reviews, signatures, diligenceStatus, treasurerSignature || undefined, profiles);
```

Isso requer importar `useTreasurerSignature` e `useProfilesByIds` no FiscalReviewPanel (se ainda não importados), e coletar os user IDs relevantes.

### Detalhes Técnicos

| Arquivo | Mudança |
|---------|---------|
| `TreasurerFiscalArea.tsx` | Remover `!hasFinalPdf` de `canGenerateFinal`; adicionar botão "Regerar" ao lado do badge "PDF Gerado" |
| `FiscalReviewPanel.tsx` | Importar hooks de treasurer signature e profiles; passar `treasurerSignature` e `profiles` ao `generateFiscalPDF` |

### O que NÃO será alterado
- O gerador de PDF (`fiscalPdfGenerator.ts`) permanece idêntico
- A lógica de assinaturas, diligências, e reviews não muda
- Nenhuma tabela ou RLS é modificada

