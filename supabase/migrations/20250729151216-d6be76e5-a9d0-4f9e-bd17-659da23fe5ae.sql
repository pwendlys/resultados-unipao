-- 1. Criar tabela shared_reports
CREATE TABLE public.shared_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  config JSONB NOT NULL,
  data JSONB NOT NULL,
  share_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for shared reports (publicly accessible for reading)
CREATE POLICY "Public access to active shared reports" 
ON public.shared_reports 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Allow insert for shared reports" 
ON public.shared_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for shared reports" 
ON public.shared_reports 
FOR UPDATE 
USING (true);

-- 2. Adicionar colunas faltantes na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN juros NUMERIC DEFAULT 0,
ADD COLUMN observacao TEXT;

-- 3. Adicionar coluna faltante na tabela extratos
ALTER TABLE public.extratos 
ADD COLUMN account_type TEXT NOT NULL DEFAULT 'conta_corrente';

-- 4. Create trigger for automatic timestamp updates on shared_reports
CREATE TRIGGER update_shared_reports_updated_at
BEFORE UPDATE ON public.shared_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();