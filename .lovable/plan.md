

## Correção: Assinatura do Tesoureiro na ATA

### Diagnóstico

O código do resolver (`meetingSignatureResolver.ts`) está correto em teoria — busca das duas tabelas (`fiscal_report_signatures` e `treasurer_signatures`). Porém há dois problemas:

1. **Erro silencioso**: As queries não fazem `error` handling. Se a query de `treasurer_signatures` falhar (ex: RLS), `data` vem `null`, `treasurerSigs?.find()` retorna `undefined`, e o tesoureiro vai para `missing` sem nenhum log.

2. **Formato do payload**: O renderer do PDF faz `sig.signaturePayload.startsWith('data:image')`. Se o payload do tesoureiro estiver em formato diferente (base64 puro, URL de storage, etc.), a imagem não renderiza — o nome aparece mas a imagem fica em branco.

### Alterações

**1. `meetingSignatureResolver.ts`** — Adicionar error handling e logs de debug:
- Log errors nas queries de ambas as tabelas
- Log para cada participante: found/not found e de qual tabela
- Se query falhar, continuar com array vazio em vez de null

**2. `meetingMinutesPdfGenerator.ts`** — Adicionar `normalizeSignatureData` helper:
- Se payload começa com `data:image` → manter
- Se payload é base64 puro (não começa com `data:`) → prefixar `data:image/png;base64,`
- Aplicar normalização antes de `doc.addImage()`
- Aplicar para TODAS as assinaturas (fiscal e tesoureiro)

**3. `meetingSignatureResolver.ts`** — Garantir que o tesoureiro é buscado primeiro na tabela correta:
- Inverter a ordem de busca: se `participant.role === 'tesoureiro'`, checar `treasurer_signatures` primeiro (em vez de `fiscal_report_signatures` primeiro)
- Isso evita uma busca desnecessária e possível confusão

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `meetingSignatureResolver.ts` | Error handling, logs, ordem de busca por role |
| `meetingMinutesPdfGenerator.ts` | Helper `normalizeSignatureData` aplicado a todos os payloads |

### O que NÃO será alterado
- Nenhuma tabela, RLS, ou migration
- Nenhum componente de UI
- Nenhum fluxo de relatórios existente

