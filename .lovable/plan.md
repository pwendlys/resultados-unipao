## Problema

O Tesoureiro já pode cadastrar uma assinatura padrão em **Minha Assinatura Digital** (`MySignatureCard`, salva em `fiscal_user_profiles.default_signature_data`). Os Fiscais, no modal deles (`FiscalSignatureModal`), recebem o botão **"Usar assinatura salva"** e a opção **"Salvar como minha assinatura padrão"**. Já o **`TreasurerSignatureModal`** não tem nenhum desses recursos — então o tesoureiro precisa redesenhar a assinatura toda vez.

## Solução (aditiva, sem alterar fluxos existentes)

Replicar no modal do Tesoureiro a mesma lógica já validada do modal Fiscal, sem mexer em assinatura real, RLS, mutations ou geração de PDF.

### 1. `src/components/treasurer/TreasurerSignatureModal.tsx`
- Adicionar props **opcionais** (não-breaking):
  - `savedSignature?: string | null`
  - `onSaveAsDefault?: (signatureData: string) => void`
- Adicionar estados `useSavedSignature` e `saveAsDefault`.
- Quando `savedSignature` existir e o usuário ainda não tiver carregado, mostrar botão **"Usar assinatura salva"** (ícone `History`) acima do canvas — igual ao Fiscal.
- Ao clicar: desenhar a imagem salva centralizada no canvas e marcar `hasSignature = true`, habilitando o botão "Confirmar Assinatura".
- Se o usuário começar a desenhar por cima, limpar o canvas e voltar ao modo "desenhar novo".
- Adicionar checkbox **"Salvar como minha assinatura padrão"** quando `onSaveAsDefault` existir e ainda não houver `savedSignature` — chamar o callback no submit.
- Nenhum comportamento atual é removido; props existentes continuam iguais.

### 2. `src/components/treasurer/TreasurerFiscalArea.tsx` (`TreasurerSignatureModalWrapper`)
- Pegar o `userId` da sessão (`supabase.auth.getSession`) ou usar hook já existente.
- Usar `useFiscalUserProfile(userId)` para ler `default_signature_data`.
- Usar `useSaveDefaultSignature()` para o callback `onSaveAsDefault`.
- Passar `savedSignature={profile?.default_signature_data ?? null}` e `onSaveAsDefault={(sig) => saveSignature.mutate({ userId, signatureData: sig })}` para `TreasurerSignatureModal`.
- Nada mais muda — `handleSubmit` continua chamando `createSignature.mutateAsync` exatamente como hoje.

## O que NÃO muda
- Tabela `treasurer_signatures`, RLS, `useTreasurerSignatureActions`, `useTreasurerSignature`.
- Hook `useFiscalUserProfile` / `useSaveDefaultSignature` (apenas consumidos).
- `MySignatureCard`, `TreasurerDashboard`, geração de PDF final, contadores.
- Fluxo dos Fiscais permanece intacto.

## Resultado
Quando o tesoureiro já tiver uma assinatura padrão salva, o modal "Assinatura do Tesoureiro" mostrará o botão **"Usar assinatura salva"**; um clique carrega a assinatura no canvas e basta confirmar — sem precisar redesenhar.