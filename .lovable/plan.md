

## Adicionar botão "Selecionar Todos" nos Relatórios Aprovados

### Alteração

**`src/components/meeting-minutes/MeetingMinutesForm.tsx`** — Na seção "Relatórios Aprovados", adicionar um botão "Selecionar Todos / Desmarcar Todos" acima da lista de checkboxes:

- Se todos os relatórios já estão selecionados → botão mostra "Desmarcar Todos" e limpa a seleção
- Caso contrário → botão mostra "Selecionar Todos" e seleciona todos os `finishedReports`
- Botão aparece apenas quando há relatórios disponíveis (junto ao título do card)

### Arquivo Modificado

| Arquivo | Mudança |
|---------|---------|
| `MeetingMinutesForm.tsx` | Botão toggle "Selecionar Todos / Desmarcar Todos" na seção de relatórios |

