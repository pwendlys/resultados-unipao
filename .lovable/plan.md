

## Correções do Módulo ATA - Plano

### Causa Raiz

O hook `useFiscalUsersFromRoles` consulta `user_roles` filtrando `role = 'fiscal'`, mas a RLS da tabela `user_roles` só permite que cada usuário veja **suas próprias** roles (`user_id = auth.uid()`), exceto admins. O tesoureiro (que tem sessão Supabase Auth válida) não consegue ver as roles de outros usuários, então a lista de fiscais retorna vazia. Sem fiscais selecionados, o texto da ata não gera (o `useEffect` exige `selectedFiscais.length > 0`). Os relatórios concluídos **já carregam** corretamente (a tabela `fiscal_reports` tem RLS pública).

### Alterações

#### 1. Migration: RLS em `user_roles` para tesoureiro

Adicionar policy SELECT permitindo tesoureiro ver roles de outros usuários:

```sql
CREATE POLICY "Treasurer can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'tesoureiro'::app_role));
```

Isso resolve a query de fiscais sem alterar nenhuma tabela ou policy existente.

#### 2. `src/components/meeting-minutes/MeetingMinutesForm.tsx`

- Adicionar campo **"Houve diligências?"** (Switch sim/não) + campo **"Resumo das diligências"** (Textarea, visível quando sim)
- Passar `hadDiligencias` e `diligencesSummary` ao `generateMinutesText`
- Adicionar estados de loading/error para fiscais e relatórios (usar `isLoading`/`isError` dos hooks)
- Salvar `had_diligences` e `diligences_summary` no snapshot da ata (campo `snapshot` jsonb já existente -- sem alterar schema)

#### 3. `src/utils/meetingMinutesTemplate.ts`

- Adicionar `diligencesSummary?: string` ao `MinutesTemplateParams`
- Quando `hasDiligencias = true` e houver summary, gerar parágrafo:
  *"O Conselho Fiscal registrou que houve diligências e observações no período analisado, conforme descrito a seguir: {summary}. Ainda assim, deliberou-se pela APROVAÇÃO..."*
- Quando `hasDiligencias = false`: manter texto atual

#### 4. `src/utils/meetingMinutesPdfGenerator.ts`

- Na seção "Diligências Consolidadas", quando `data.diligencias.length === 0` e existir `diligencesSummary` no snapshot, renderizar o resumo informado pelo tesoureiro em vez de "Não foram registradas diligências"

### Arquivos Modificados

| Arquivo | Tipo |
|---------|------|
| Migration SQL (nova) | RLS policy em `user_roles` |
| `MeetingMinutesForm.tsx` | +Switch diligências, +loading states |
| `meetingMinutesTemplate.ts` | +diligencesSummary no texto |
| `meetingMinutesPdfGenerator.ts` | Ajuste seção diligências |

### O que NÃO será alterado
- Nenhuma tabela existente (schema)
- Nenhum componente fora do módulo ATA
- Nenhum fluxo de relatórios/assinaturas existente
- As 4 tabelas de meeting minutes permanecem como estão

