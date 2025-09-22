-- Create table for stock balance uploads
CREATE TABLE public.balancos_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  periodo TEXT NOT NULL,
  total_itens INTEGER DEFAULT 0,
  itens_negativos INTEGER DEFAULT 0,
  itens_positivos INTEGER DEFAULT 0,
  itens_neutros INTEGER DEFAULT 0,
  resultado_monetario DECIMAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processado',
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for individual stock balance items
CREATE TABLE public.itens_balanco (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  balanco_id UUID NOT NULL,
  codigo TEXT,
  descricao TEXT,
  quantidade_sistema DECIMAL,
  quantidade_real DECIMAL,
  diferenca_quantidade DECIMAL,
  unitario DECIMAL,
  valor_sistema DECIMAL,
  valor_real DECIMAL,
  diferenca_monetaria DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for column mapping preferences
CREATE TABLE public.mapeamentos_colunas_balanco (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  mapeamento JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.balancos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_balanco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapeamentos_colunas_balanco ENABLE ROW LEVEL SECURITY;

-- Create policies for balancos_estoque
CREATE POLICY "Permitir acesso total aos balanços de estoque" 
ON public.balancos_estoque 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for itens_balanco
CREATE POLICY "Permitir acesso total aos itens de balanço" 
ON public.itens_balanco 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for mapeamentos_colunas_balanco
CREATE POLICY "Permitir acesso total aos mapeamentos de colunas de balanço" 
ON public.mapeamentos_colunas_balanco 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates on balancos_estoque
CREATE TRIGGER update_balancos_estoque_updated_at
BEFORE UPDATE ON public.balancos_estoque
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on mapeamentos_colunas_balanco
CREATE TRIGGER update_mapeamentos_colunas_balanco_updated_at
BEFORE UPDATE ON public.mapeamentos_colunas_balanco
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();