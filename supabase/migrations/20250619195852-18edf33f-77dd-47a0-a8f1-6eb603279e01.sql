
-- Adicionar 'Cora' como um novo tipo de conta válido
ALTER TABLE public.extratos 
DROP CONSTRAINT IF EXISTS extratos_account_type_check;

ALTER TABLE public.extratos 
ADD CONSTRAINT extratos_account_type_check 
CHECK (account_type IN ('BOLETOS', 'MENSALIDADES E TX ADM', 'APORTE E JOIA', 'Cora'));
