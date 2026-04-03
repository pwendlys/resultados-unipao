

## Modulo: Ata da Reuniao do Conselho Fiscal

### Resumo

Criar um modulo completo para o Tesoureiro gerar Atas de Reuniao do Conselho Fiscal, com reuso de assinaturas existentes dos relatorios fiscais e geracao de PDF formal no estilo ata tradicional.

### 1. Banco de Dados (4 migrações)

**Tabela `fiscal_meeting_minutes`**
```sql
create table public.fiscal_meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  meeting_type text not null default 'ordinária',
  location text,
  created_by uuid not null,
  minutes_text text,
  status text not null default 'draft',
  snapshot jsonb,
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Tabela `fiscal_meeting_minutes_participants`**
```sql
create table public.fiscal_meeting_minutes_participants (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references fiscal_meeting_minutes(id) on delete cascade,
  user_id uuid not null,
  participant_role text not null,
  display_name_snapshot text,
  is_required_signature boolean default true,
  created_at timestamptz default now()
);
```

**Tabela `fiscal_meeting_minutes_reports`**
```sql
create table public.fiscal_meeting_minutes_reports (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references fiscal_meeting_minutes(id) on delete cascade,
  fiscal_report_id uuid not null,
  approved boolean default true,
  created_at timestamptz default now()
);
```

**Tabela `fiscal_meeting_minutes_signature_sources`**
```sql
create table public.fiscal_meeting_minutes_signature_sources (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references fiscal_meeting_minutes(id) on delete cascade,
  user_id uuid not null,
  signature_payload text not null,
  source_report_id uuid not null,
  source_signature_id uuid,
  signed_at_original timestamptz,
  unique(minutes_id, user_id),
  created_at timestamptz default now()
);
```

**RLS**: Tesoureiro/Admin tem CRUD completo. Fiscais tem SELECT para visualizar.

### 2. Hooks (novos arquivos, sem alterar existentes)

**`src/hooks/useMeetingMinutes.ts`**
- `useMeetingMinutes()` - lista todas as atas
- `useMeetingMinutesById(id)` - detalhe de uma ata
- `useMeetingMinutesActions()` - create, update, delete mutations
- `useMeetingMinutesParticipants(minutesId)` - participantes
- `useMeetingMinutesReports(minutesId)` - relatorios vinculados
- `useMeetingMinutesSignatureSources(minutesId)` - assinaturas reutilizadas

**`src/hooks/useFiscalUsersFromRoles.ts`**
- Busca usuarios com role `fiscal` da tabela `user_roles` + `profiles` para o multi-select de participantes

### 3. Logica de Reuso de Assinaturas

**`src/utils/meetingSignatureResolver.ts`**
- Recebe lista de participantes obrigatorios + lista de report IDs selecionados
- Busca `fiscal_report_signatures` e `treasurer_signatures` dos relatorios selecionados
- Para cada participante, encontra a assinatura mais recente (maior `created_at`/`signed_at`)
- Retorna `{ resolved: Map<userId, SignatureSource>, missing: string[] }`
- Se `missing.length > 0`, bloqueia geracao

### 4. Gerador de PDF da Ata

**`src/utils/meetingMinutesPdfGenerator.ts`**
- Usa jsPDF (mesmo padrao do fiscalPdfGenerator)
- Estrutura:
  1. Titulo em caixa alta centralizado
  2. Texto da ata em paragrafos (justificado)
  3. Secao "Relatorios Aprovados" (lista)
  4. Secao "Diligencias Consolidadas" (se houver)
  5. Secao "Assinaturas" - uma por participante obrigatorio com imagem da assinatura reutilizada, nome, cargo, e data original

### 5. Template da Ata

**`src/utils/meetingMinutesTemplate.ts`**
- Funcao `generateMinutesText(params)` que retorna o texto pre-preenchido conforme especificado (dias por extenso, nomes dos participantes, clausula de convidados, resultado de diligencias)

### 6. Componentes UI (novos, dentro de `src/components/meeting-minutes/`)

**`MeetingMinutesList.tsx`** - Lista de atas com status, botoes de visualizar/baixar/excluir

**`MeetingMinutesForm.tsx`** - Formulario "Nova Ata":
- Data (DatePicker)
- Tipo (Select: ordinaria/extraordinaria)
- Local (Input opcional)
- Participantes: Tesoureiro (auto, bloqueado) + Fiscais (multi-select) + Convidados (multi-select com input livre)
- Relatorios (multi-select de relatorios com status finished)
- Editor de texto (Textarea pre-preenchido)
- Botoes: "Validar Assinaturas" e "Gerar PDF"

**`MeetingMinutesDetail.tsx`** - Detalhe com relatorios incluidos, diligencias consolidadas, assinaturas com origem, download PDF

**`MeetingMinutesPage.tsx`** - Componente container que alterna entre lista, form e detalhe

### 7. Integracao na Navegacao

**`src/components/layout/TreasurerNavigation.tsx`** - Adicionar item de menu "Atas do Conselho" com icone `BookOpen`

**`src/pages/TreasurerIndex.tsx`** - Adicionar case `'tesoureiro-atas'` no switch, renderizando `MeetingMinutesPage`

### 8. Fluxo do Usuario

```text
1. Tesoureiro clica "Atas do Conselho" no menu
2. Ve lista de atas existentes
3. Clica "Nova Ata"
4. Preenche data, tipo, seleciona fiscais e relatorios
5. Texto e automaticamente gerado
6. Clica "Validar Assinaturas"
   -> Sistema busca assinaturas nos relatorios selecionados
   -> Se faltou alguem: mostra aviso com nome
   -> Se todos ok: salva snapshot e muda status para 'ready'
7. Clica "Gerar PDF"
   -> PDF gerado com jsPDF
   -> Upload para bucket fiscal-files
   -> Status muda para 'pdf_generated'
8. Download disponivel na lista e no detalhe
```

### Arquivos Novos (10)
| Arquivo | Descricao |
|---------|-----------|
| Migration SQL | 4 tabelas + RLS |
| `src/hooks/useMeetingMinutes.ts` | CRUD hooks |
| `src/hooks/useFiscalUsersFromRoles.ts` | Busca fiscais |
| `src/utils/meetingSignatureResolver.ts` | Resolucao de assinaturas |
| `src/utils/meetingMinutesPdfGenerator.ts` | Gerador PDF |
| `src/utils/meetingMinutesTemplate.ts` | Template texto |
| `src/components/meeting-minutes/MeetingMinutesList.tsx` | Lista |
| `src/components/meeting-minutes/MeetingMinutesForm.tsx` | Formulario |
| `src/components/meeting-minutes/MeetingMinutesDetail.tsx` | Detalhe |
| `src/components/meeting-minutes/MeetingMinutesPage.tsx` | Container |

### Arquivos Modificados (2, apenas adicoes)
| Arquivo | Mudanca |
|---------|--------|
| `TreasurerNavigation.tsx` | +1 item menu |
| `TreasurerIndex.tsx` | +1 case no switch |

### O que NAO sera alterado
- Nenhum componente, hook ou util existente
- Nenhuma tabela existente
- Nenhuma RLS existente
- O fluxo de assinaturas dos relatorios permanece identico
- O PDF dos relatorios permanece identico

