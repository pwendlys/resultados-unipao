
-- Criar tabela para armazenar relatórios compartilhados
CREATE TABLE public.shared_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  config JSONB NOT NULL,
  data JSONB NOT NULL,
  share_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar RLS na tabela
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total aos relatórios compartilhados (público)
CREATE POLICY "Permitir acesso total aos relatórios compartilhados" 
  ON public.shared_reports 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_shared_reports_updated_at
  BEFORE UPDATE ON public.shared_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para melhorar performance nas consultas por share_id
CREATE INDEX idx_shared_reports_share_id ON public.shared_reports(share_id);
CREATE INDEX idx_shared_reports_active ON public.shared_reports(is_active);
