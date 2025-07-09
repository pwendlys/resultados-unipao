
-- Adicionar campo de juros na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN juros NUMERIC DEFAULT 0;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.transactions.juros IS 'Valor dos juros aplicados na transação';
