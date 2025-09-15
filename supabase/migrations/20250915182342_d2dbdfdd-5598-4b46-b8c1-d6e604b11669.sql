-- Create table for custom dashboards
CREATE TABLE public.dashboards_personalizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for custom entries
CREATE TABLE public.entradas_personalizadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES public.dashboards_personalizados(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dashboards_personalizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas_personalizadas ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Permitir acesso total aos dashboards personalizados" 
ON public.dashboards_personalizados 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir acesso total às entradas personalizadas" 
ON public.entradas_personalizadas 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dashboards_personalizados_updated_at
BEFORE UPDATE ON public.dashboards_personalizados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entradas_personalizadas_updated_at
BEFORE UPDATE ON public.entradas_personalizadas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_entradas_personalizadas_dashboard_id ON public.entradas_personalizadas(dashboard_id);
CREATE INDEX idx_entradas_personalizadas_ano_mes ON public.entradas_personalizadas(ano, mes);
CREATE INDEX idx_entradas_personalizadas_categoria ON public.entradas_personalizadas(categoria);
CREATE INDEX idx_entradas_personalizadas_tipo ON public.entradas_personalizadas(tipo);