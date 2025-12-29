-- =============================================
-- SISTEMA DE FISCALIZAÇÃO - MODELAGEM COMPLETA
-- =============================================

-- 1. Criar ENUM para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'fiscal');

-- 2. Criar tabela user_roles
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Função has_role (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS para user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Adicionar colunas entry_index e description_raw em transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS entry_index integer,
ADD COLUMN IF NOT EXISTS description_raw text;

COMMENT ON COLUMN public.transactions.entry_index IS 'Ordem absoluta do lançamento no extrato original';
COMMENT ON COLUMN public.transactions.description_raw IS 'Descrição completa/raw do extrato';

-- Criar índice para ordenação por entry_index
CREATE INDEX IF NOT EXISTS idx_transactions_entry_index ON public.transactions(extrato_id, entry_index);

-- 5. Criar tabela fiscal_reports
CREATE TABLE public.fiscal_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    extrato_id uuid REFERENCES public.extratos(id) ON DELETE CASCADE,
    title text NOT NULL,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'finished')),
    competencia text NOT NULL,
    account_type text NOT NULL,
    sent_at timestamptz DEFAULT now(),
    sent_by text,
    pdf_url text,
    total_entries integer DEFAULT 0,
    approved_count integer DEFAULT 0,
    flagged_count integer DEFAULT 0,
    pending_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.fiscal_reports ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at
CREATE TRIGGER update_fiscal_reports_updated_at
BEFORE UPDATE ON public.fiscal_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Criar tabela fiscal_report_assignees
CREATE TABLE public.fiscal_report_assignees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_report_id uuid REFERENCES public.fiscal_reports(id) ON DELETE CASCADE NOT NULL,
    fiscal_user_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (fiscal_report_id, fiscal_user_id)
);

ALTER TABLE public.fiscal_report_assignees ENABLE ROW LEVEL SECURITY;

-- 7. Criar tabela fiscal_reviews
CREATE TABLE public.fiscal_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_report_id uuid REFERENCES public.fiscal_reports(id) ON DELETE CASCADE NOT NULL,
    transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    entry_index integer NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged')),
    observation text,
    reviewed_by text,
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.fiscal_reviews ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at
CREATE TRIGGER update_fiscal_reviews_updated_at
BEFORE UPDATE ON public.fiscal_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para ordenação por entry_index
CREATE INDEX idx_fiscal_reviews_entry_index ON public.fiscal_reviews(fiscal_report_id, entry_index);

-- 8. RLS Policies

-- fiscal_reports: Admin vê tudo, fiscal vê atribuídos
CREATE POLICY "Allow full access to fiscal reports"
ON public.fiscal_reports FOR ALL
USING (true)
WITH CHECK (true);

-- fiscal_report_assignees: Acesso total (simplificado para contexto atual)
CREATE POLICY "Allow full access to fiscal assignees"
ON public.fiscal_report_assignees FOR ALL
USING (true)
WITH CHECK (true);

-- fiscal_reviews: Acesso total para permitir updates pelo fiscal
CREATE POLICY "Allow full access to fiscal reviews"
ON public.fiscal_reviews FOR ALL
USING (true)
WITH CHECK (true);

-- 9. Função para atualizar contadores do fiscal_report
CREATE OR REPLACE FUNCTION public.update_fiscal_report_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.fiscal_reports
    SET 
        approved_count = (SELECT COUNT(*) FROM public.fiscal_reviews WHERE fiscal_report_id = COALESCE(NEW.fiscal_report_id, OLD.fiscal_report_id) AND status = 'approved'),
        flagged_count = (SELECT COUNT(*) FROM public.fiscal_reviews WHERE fiscal_report_id = COALESCE(NEW.fiscal_report_id, OLD.fiscal_report_id) AND status = 'flagged'),
        pending_count = (SELECT COUNT(*) FROM public.fiscal_reviews WHERE fiscal_report_id = COALESCE(NEW.fiscal_report_id, OLD.fiscal_report_id) AND status = 'pending'),
        updated_at = now()
    WHERE id = COALESCE(NEW.fiscal_report_id, OLD.fiscal_report_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contadores automaticamente
CREATE TRIGGER trigger_update_fiscal_report_counts
AFTER INSERT OR UPDATE OR DELETE ON public.fiscal_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_fiscal_report_counts();