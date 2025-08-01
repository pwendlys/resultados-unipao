-- Criar tabela para documentos financeiros
CREATE TABLE public.documentos_financeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('contas_a_receber', 'contas_a_pagar', 'contas_vencidas')),
  arquivo_original TEXT NOT NULL,
  periodo TEXT NOT NULL,
  banco TEXT,
  valor_total NUMERIC DEFAULT 0,
  quantidade_documentos INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para itens dos documentos financeiros
CREATE TABLE public.itens_financeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos_financeiros(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE,
  data_emissao DATE,
  numero_documento TEXT,
  categoria TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  observacao TEXT,
  juros NUMERIC DEFAULT 0,
  multa NUMERIC DEFAULT 0,
  valor_pago NUMERIC,
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_financeiros ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Permitir acesso total aos documentos financeiros" 
ON public.documentos_financeiros 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir acesso total aos itens financeiros" 
ON public.itens_financeiros 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_documentos_financeiros_updated_at
BEFORE UPDATE ON public.documentos_financeiros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itens_financeiros_updated_at
BEFORE UPDATE ON public.itens_financeiros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_documentos_financeiros_tipo ON public.documentos_financeiros(tipo_documento);
CREATE INDEX idx_documentos_financeiros_created_at ON public.documentos_financeiros(created_at);
CREATE INDEX idx_itens_financeiros_documento_id ON public.itens_financeiros(documento_id);
CREATE INDEX idx_itens_financeiros_data_vencimento ON public.itens_financeiros(data_vencimento);
CREATE INDEX idx_itens_financeiros_status ON public.itens_financeiros(status);