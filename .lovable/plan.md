# Adicionar edição da assinatura padrão nos painéis

## Objetivo
Exibir, logo abaixo do "Meu Perfil" nos painéis **Fiscal** e **Tesoureiro**, um card "Minha Assinatura Digital" onde o usuário pode visualizar a assinatura padrão salva e substituí-la por uma nova. A assinatura salva continua sendo a mesma já utilizada hoje ao assinar relatórios e atas.

## Política de não-alteração
Nada das funcionalidades atuais será modificado:
- Tabela `fiscal_user_profiles` e hooks `useFiscalUserProfile` / `useSaveDefaultSignature` permanecem intactos (apenas reutilizados).
- Modais `FiscalSignatureModal` e `TreasurerSignatureModal` não serão alterados.
- Fluxos de assinatura de relatórios, atas, geração de PDF, RLS, auth e dashboards permanecem iguais.
- Apenas dois pontos de inserção visual nos dashboards e um novo componente isolado.

## Mudanças

### 1. Novo componente `src/components/profile/MySignatureCard.tsx`
Card auto-contido que:
- Recebe `userId: string` como prop.
- Usa `useFiscalUserProfile(userId)` para mostrar a assinatura salva (preview da imagem) e a data da última atualização.
- Botão "Editar assinatura" abre um `Dialog` com canvas de desenho (mesma UX dos modais atuais — mouse/touch, limpar, confirmar).
- Botão "Salvar" chama `useSaveDefaultSignature` com o dataURL do canvas.
- Se ainda não houver assinatura salva, exibe estado vazio com botão "Criar assinatura".
- Toast de sucesso/erro via `useToast` existente.

### 2. `src/components/fiscal/FiscalDashboard.tsx`
Inserir `<MySignatureCard userId={session.user.id} />` imediatamente abaixo do `<ProfileCard />` já existente. Nenhuma outra mudança.

### 3. `src/components/treasurer/TreasurerDashboard.tsx`
Inserir `<MySignatureCard userId={session.user.id} />` imediatamente abaixo do `<ProfileCard />` já existente. Nenhuma outra mudança.

## Detalhes técnicos
- O canvas do novo componente é uma cópia simplificada do desenho usado em `FiscalSignatureModal` (apenas a parte de desenhar + limpar + confirmar). Não importa nem altera os modais existentes para evitar acoplamento.
- Como `useSaveDefaultSignature` faz `upsert` em `fiscal_user_profiles`, a substituição é nativa — qualquer assinatura nova sobrescreve a anterior.
- A assinatura salva é lida pelos modais atuais via `savedSignature` prop, então a troca aqui passa a refletir automaticamente nas próximas assinaturas de relatórios/atas, sem mudar nenhum código de assinatura.

## Sem alterações em
- Banco de dados / RLS / migrações
- Edge functions
- PDF generators
- Hooks de relatórios, reviews, atas, signatures
- Componentes de modal de assinatura
- Auth, roles, navegação
