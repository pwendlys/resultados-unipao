-- Tabela para armazenar assinatura padrão do usuário fiscal
CREATE TABLE public.fiscal_user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  default_signature_data text,
  default_signature_updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.fiscal_user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuário pode ler apenas seu próprio perfil
CREATE POLICY "Users can read own fiscal profile"
  ON public.fiscal_user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own fiscal profile"
  ON public.fiscal_user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- Usuário pode inserir apenas seu próprio perfil
CREATE POLICY "Users can insert own fiscal profile"
  ON public.fiscal_user_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());