
-- Adicionar coluna account_type na tabela extratos
ALTER TABLE public.extratos 
ADD COLUMN account_type TEXT NOT NULL DEFAULT 'BOLETOS' 
CHECK (account_type IN ('BOLETOS', 'MENSALIDADES E TX ADM', 'APORTE E JOIA'));

-- Comentário sobre os tipos de conta:
-- BOLETOS: para boletos e pagamentos das mercadorias
-- MENSALIDADES E TX ADM: para mensalidades de taxas administrativas e pagamento das despesas da cooperativa
-- APORTE E JOIA: para aporte e joia dos cooperados e para investimentos da cooperativa, compra de produtos e bens
