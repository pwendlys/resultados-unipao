

## Correção: Nomes de perfil sobrepondo entre usuários

### Problema Identificado

O hook `useProfile` usa `queryKey: ['profile']` sem incluir o ID do usuário. Quando um fiscal faz logout e outro faz login no mesmo navegador, o React Query serve dados do cache do usuário anterior (nome errado). Além disso, o logout não limpa o cache do React Query.

### Solução (2 arquivos, sem alterar funcionalidades existentes)

#### 1. Corrigir `src/hooks/useProfile.ts` - Incluir user ID no query key

Adicionar o ID do usuário autenticado ao `queryKey` para que cada usuário tenha seu próprio cache:

```typescript
// Antes:
queryKey: ['profile'],

// Depois:  
queryKey: ['profile', userId],  // userId obtido de supabase.auth.getUser()
```

Modificar o `useProfile` para primeiro obter a sessao e usar o user.id tanto no queryKey quanto na query. Isso garante que ao trocar de usuário, o cache é diferente.

Da mesma forma, atualizar o `invalidateQueries` no `useUpdateProfile` para invalidar com o user ID correto.

#### 2. Limpar cache do React Query no logout

Nos componentes de logout (`FiscalNavigation.tsx` e `TreasurerNavigation.tsx`), adicionar limpeza do cache ao fazer logout:

```typescript
import { useQueryClient } from '@tanstack/react-query';

const handleLogout = async () => {
  const queryClient = useQueryClient();
  queryClient.clear(); // Limpa todo o cache
  await supabase.auth.signOut();
};
```

### Detalhes Técnicos

**Arquivo 1: `src/hooks/useProfile.ts`**
- Modificar `useProfile()` para buscar o user ID via `supabase.auth.getSession()` e incluir no `queryKey`
- Modificar `useUpdateProfile()` para invalidar queries com o user ID correto
- Nenhuma mudanca nas demais funcoes (`useProfileById`, `useProfilesByIds`)

**Arquivo 2: `src/components/layout/FiscalNavigation.tsx`**
- Importar `useQueryClient` do React Query
- No `handleLogout`, chamar `queryClient.clear()` antes do `signOut()`

**Arquivo 3: `src/components/layout/TreasurerNavigation.tsx`**
- Mesma limpeza de cache no logout

### O que NAO sera alterado
- Nenhuma tabela ou RLS sera modificada
- Nenhuma funcionalidade existente sera alterada
- O `ProfileCard.tsx` permanece identico
- Os modais de assinatura permanecem identicos
- O PDF generator permanece identico

