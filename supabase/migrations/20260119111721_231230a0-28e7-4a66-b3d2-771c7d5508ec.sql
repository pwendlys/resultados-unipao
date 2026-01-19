-- Tabela de assinaturas digitais para relatórios fiscais
CREATE TABLE public.fiscal_report_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.fiscal_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    signature_data TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(report_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.fiscal_report_signatures ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem inserir apenas própria assinatura
CREATE POLICY "Users can insert own signature"
ON public.fiscal_report_signatures
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários autenticados podem ver assinaturas
CREATE POLICY "Users can view signatures"
ON public.fiscal_report_signatures
FOR SELECT
TO authenticated
USING (true);

-- Admin pode deletar assinaturas
CREATE POLICY "Admin can delete signatures"
ON public.fiscal_report_signatures
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Função para verificar e atualizar status do relatório quando atingir 3 assinaturas
CREATE OR REPLACE FUNCTION public.check_report_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    signature_count INTEGER;
    pending_count INTEGER;
    flagged_count INTEGER;
BEGIN
    -- Contar assinaturas distintas para este relatório
    SELECT COUNT(DISTINCT user_id) INTO signature_count
    FROM public.fiscal_report_signatures
    WHERE report_id = NEW.report_id;
    
    -- Verificar se há pendentes ou divergentes
    SELECT 
        COALESCE(fr.pending_count, 0),
        COALESCE(fr.flagged_count, 0)
    INTO pending_count, flagged_count
    FROM public.fiscal_reports fr
    WHERE fr.id = NEW.report_id;
    
    -- Se tiver 3+ assinaturas e 0 pendentes/divergentes, marcar como finished
    IF signature_count >= 3 AND pending_count = 0 AND flagged_count = 0 THEN
        UPDATE public.fiscal_reports
        SET status = 'finished', updated_at = now()
        WHERE id = NEW.report_id AND status != 'finished';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para verificar conclusão após nova assinatura
CREATE TRIGGER check_report_completion_trigger
AFTER INSERT ON public.fiscal_report_signatures
FOR EACH ROW
EXECUTE FUNCTION public.check_report_completion();