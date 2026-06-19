## Objetivo
Incluir a "Observação" do ADM (campo `transactions.observacao`) no PDF do Conselho Fiscal, especificamente na seção **DILIGÊNCIAS REGISTRADAS**, para justificar/esclarecer cada diligência — sem alterar qualquer outro comportamento.

## Análise
- O hook `useFiscalReviews` já carrega `transaction.observacao`, então o dado já está disponível em `review.transaction.observacao` dentro de `fiscalPdfGenerator.ts`.
- Na seção de Diligências (linhas ~199-243), exibimos hoje: data/descrição, valor, marcado por, e o "Motivo" (observação divergente do fiscal). **Não exibimos a observação do ADM**, que é o campo que esclarece o que é a transação.
- Na tabela principal de transações o pedido é apenas referente ao PDF de diligências (justificar). Não vamos mexer na tabela principal para não alterar layout/funcionalidades existentes.

## Mudança (mínima e aditiva)
**Arquivo:** `src/utils/fiscalPdfGenerator.ts`

Dentro do loop `diligentTransactions.forEach(...)`, **após** o bloco do "Motivo" (`diligenceInfo.divergentObservation`) e **antes** do `yPos += 8` final, adicionar:

```ts
const admObs = transaction?.observacao;
if (admObs && admObs.trim()) {
  doc.setTextColor(80, 80, 80);
  const admLines = doc.splitTextToSize(`   Obs. ADM: ${admObs}`, pageWidth - 28);
  // quebra de página se necessário
  if (yPos + admLines.length * 4 > 280) {
    doc.addPage();
    yPos = 20;
  }
  doc.text(admLines, 14, yPos);
  yPos += admLines.length * 4;
  doc.setTextColor(0, 0, 0);
}
```

## O que NÃO muda
- Tabela principal de transações do PDF (layout idêntico).
- Hooks, queries, schema do banco.
- Modal de diligências, painel fiscal, painel tesoureiro.
- Ordem/contagem de diligências, assinaturas, ack 3/3.
- Nenhuma função existente é renomeada ou reestruturada — apenas inserção de um bloco aditivo dentro do forEach.

## Resultado
Cada diligência no PDF passa a exibir, abaixo do "Motivo", a "Obs. ADM" com o texto completo (com quebra de linha automática via `splitTextToSize`), permitindo ao leitor entender o contexto que o ADM registrou para aquela transação.