-- Create table for assets and liabilities tracking
CREATE TABLE public.ativos_passivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  
  -- ATIVOS (Assets)
  saldo_do_dia NUMERIC DEFAULT 0,
  a_receber NUMERIC DEFAULT 0,
  vencida NUMERIC DEFAULT 0,
  estoque NUMERIC DEFAULT 0,
  investimento NUMERIC DEFAULT 0,
  
  -- PASSIVOS (Liabilities)
  a_pagar NUMERIC DEFAULT 0,
  joia NUMERIC DEFAULT 0,
  aporte NUMERIC DEFAULT 0,
  
  -- METADATA
  data_referencia DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.ativos_passivos ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (same pattern as other tables in the project)
CREATE POLICY "Permitir acesso total aos ativos e passivos"
ON public.ativos_passivos
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic updated_at
CREATE TRIGGER update_ativos_passivos_updated_at
BEFORE UPDATE ON public.ativos_passivos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();