## Diagnóstico

Após a investigação:

- A coluna `transactions.observacao` está corretamente preenchida no banco (confirmado: o lançamento "PIX EMITIDO OUTRA IF — R$ 154,00" tem `observacao = "Fonte Notbook"`).
- A query `useFiscalReviews` já inclui `observacao` no `select` do join com `transactions`.
- O `FiscalReviewItem.tsx` já renderiza o bloco azul "Observação" tanto no card principal quanto no expand.
- O salvamento na tela de Categorização (individual e em massa) grava corretamente em `transactions.observacao`.

**Conclusão:** o código está correto. O motivo de não aparecer na tela atual é **cache do React Query**: o painel fiscal foi aberto antes da inclusão do campo `observacao` no select, então o cache em memória ainda guarda o objeto `transaction` sem essa coluna. Como o `staleTime` padrão mantém esses dados, novos refetchs só acontecem em invalidações específicas (aprovar/divergente), e mesmo assim a sessão atual pode reusar dados antigos.

Além disso, observações editadas pelo ADM **depois** que o relatório foi despachado ao fiscal não disparam nenhuma invalidação no painel fiscal — então o fiscal/tesoureiro que estiver com o painel aberto não vê a mudança até dar refresh manual.

## Mudanças propostas (somente aditivas, sem alterar fluxos)

### 1. `src/hooks/useFiscalReviews.ts`
Forçar dados sempre frescos ao abrir/voltar ao painel, garantindo que qualquer observação salva pelo ADM (antes ou depois do despacho) apareça imediatamente:

- Adicionar nas opções do `useQuery`:
  - `staleTime: 0`
  - `refetchOnMount: 'always'`
  - `refetchOnWindowFocus: true`

Nenhuma mutation, schema, RLS ou outro hook é alterado.

### 2. `src/components/fiscal/FiscalReviewPanel.tsx` (mínimo, opcional)
Adicionar um pequeno botão discreto "Atualizar" no header da lista que chama `queryClient.invalidateQueries({ queryKey: ['fiscal-reviews', reportId] })`, para que o fiscal/tesoureiro consiga forçar a releitura quando o ADM editar a observação com o painel aberto. Não substitui nenhum botão existente.

## O que NÃO muda

- Schema do banco, RLS, triggers, edge functions.
- Tela de Categorização do ADM e suas mutations.
- Hooks `useFiscalReports`, `useFiscalReviewsActions`, `useFiscalUserReviews`.
- Fluxo de assinatura, geração de PDF, painel do tesoureiro (consome os mesmos componentes — passa a refletir as observações automaticamente).
- Lógica de aprovação, divergência, diligência ou contagem 0/3.

## Resultado esperado

- Ao abrir/voltar para o painel fiscal (ou painel do tesoureiro), todas as observações aparecem imediatamente, inclusive em relatórios já despachados.
- Edições de observação feitas pelo ADM depois do despacho passam a aparecer via refetch automático (janela em foco) ou via o novo botão Atualizar.