
-- Criar tabela para extratos
CREATE TABLE public.extratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  period TEXT NOT NULL,
  bank TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  status TEXT NOT NULL DEFAULT 'pendente',
  transactions_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para transações
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extrato_id UUID REFERENCES public.extratos(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'categorizado')),
  suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir categorias padrão de saída
INSERT INTO public.categories (name, type) VALUES
('Folha de Pagamento', 'saida'),
('Vale Transporte', 'saida'),
('Adiantamento', 'saida'),
('Aluguel', 'saida'),
('Internet/Água/Luz', 'saida'),
('Encargos Sociais', 'saida'),
('Serviços de Terceiros', 'saida'),
('Fretes/Mat. Escritório/Café', 'saida');

-- Inserir categorias padrão de entrada
INSERT INTO public.categories (name, type) VALUES
('Mensalidade', 'entrada'),
('Taxa Administrativa', 'entrada');

-- Habilitar RLS em todas as tabelas (dados públicos para a cooperativa)
ALTER TABLE public.extratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para todos os usuários (ambiente cooperativo)
CREATE POLICY "Permitir acesso total aos extratos" ON public.extratos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total às transações" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total às categorias" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_extratos_updated_at BEFORE UPDATE ON public.extratos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
