-- Criar função para soft delete de relatórios compartilhados
CREATE OR REPLACE FUNCTION public.soft_delete_shared_report(report_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE shared_reports 
  SET is_active = false, updated_at = now()
  WHERE id = report_id;
END;
$$;

-- Permitir que qualquer usuário execute a função
GRANT EXECUTE ON FUNCTION public.soft_delete_shared_report(UUID) TO public;