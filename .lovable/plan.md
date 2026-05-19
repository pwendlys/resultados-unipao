# Plano para corrigir o status no painel do fiscal

## Diagnóstico
Encontrei dois pontos distintos causando a divergência:

1. **O início do fiscal (`FiscalDashboard`) ainda não considera a finalização pela tesouraria**.
   - Hoje ele depende de `report.status === 'finished'` para marcar como concluído.
   - Nos relatórios citados, vários estão com `treasurer_signatures = 1`, mas continuam com `status = 'open'` e `pdf_url = null`.

2. **O fiscal provavelmente não consegue enxergar `treasurer_signatures` por RLS**.
   - A tabela `treasurer_signatures` hoje só permite leitura para:
     - admin/tesoureiro
     - o próprio tesoureiro que assinou
   - Não há política de leitura para usuários com role `fiscal`.
   - Isso explica por que a aba de relatórios continuou sem atualizar mesmo após a lógica anterior: o frontend fiscal consulta `treasurer_signatures`, mas para o fiscal essa leitura não retorna o que precisa.

Também confirmei no banco que os relatórios recentes já têm assinatura da tesouraria, por exemplo:
- Relatório Cora Dez 25
- Relatório Cora Nov 25
- Relatório Aporte e Joia Jan 26
- Relatório Mensalidades e Tx Adm Jan 26
- Relatório Boletos Jan 26

## O que vou implementar

### 1) Ajuste mínimo de acesso aos dados da tesouraria
Criar uma **correção de acesso somente para leitura** da informação necessária ao fiscal sobre `treasurer_signatures`, sem mexer no fluxo de assinatura existente.

Abordagem segura:
- liberar leitura para usuários `fiscal` apenas nessa tabela, mantendo inserção restrita ao `tesoureiro`
- não alterar criação, edição ou exclusão de assinaturas

Isso preserva a lógica atual e só resolve a visibilidade do status.

### 2) Corrigir a lógica do início do fiscal
Atualizar `useFiscalUserStats` / `FiscalDashboard` para considerar como concluído quando houver evidência de conclusão da tesouraria, alinhando com a regra já usada no restante do sistema:
- `report.status === 'finished'`
- **ou** existir assinatura da tesouraria para o relatório
- **ou** existir PDF final, quando aplicável

Com isso:
- os cards do início deixam de mostrar “Aguardando outros” para relatórios já finalizados pela tesouraria
- contadores de pendência/concluídos passam a refletir o estado real

### 3) Garantir o mesmo comportamento na aba “Relatórios”
Revisar o caminho `FiscalReportsList` + `useReportsListStats` para que a regra funcione de ponta a ponta com os dados liberados por RLS.

Sem refatorar estrutura:
- manter o cálculo atual
- só garantir que `hasTreasurerSigned` chegue corretamente para o fiscal
- validar que o status exibido vire `Finalizado` para todos os relatórios já concluídos

### 4) Garantir atualização automática da tela
Verificar/incluir invalidação de cache e atualização reativa para o contexto fiscal quando `treasurer_signatures` mudar, evitando que a tela fique presa em estado antigo.

## Arquivos que devem ser ajustados
- `src/hooks/useFiscalUserStats.ts`
- `src/components/fiscal/FiscalDashboard.tsx`
- `src/hooks/useReportsListStats.ts`
- possivelmente `src/hooks/useFiscalReports.ts` apenas se faltar invalidação/realtime para o caso fiscal
- migração Supabase para política de leitura em `treasurer_signatures`

## O que não vou alterar
- fluxo de revisão fiscal
- fluxo de assinatura do tesoureiro
- geração de PDF
- estrutura de relatórios
- regras de diligência
- autenticação e navegação existentes
- qualquer refatoração ampla

## Validação
Depois da implementação, vou validar especificamente:
- início do fiscal mostrando os relatórios finalizados corretamente
- aba “Relatórios para Revisão” com os mesmos relatórios como finalizados
- ausência de impacto no painel da tesouraria
- ausência de impacto no fluxo de assinatura existente

## Detalhe técnico
A correção principal é alinhar **fonte de verdade + permissão de leitura**:
- hoje o sistema sabe que a tesouraria assinou
- mas o fiscal não consegue usar essa informação em todos os pontos
- a correção será **aditiva e localizada**, sem reestruturar os fluxos atuais