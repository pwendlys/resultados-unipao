-- Permitir leitura pública de fiscal_user_reviews para agregação no painel do tesoureiro
-- Esta policy permite que qualquer usuário (incluindo os hardcoded) consiga ler os dados para agregação
-- A escrita (INSERT/UPDATE/DELETE) continua protegida pelas policies existentes
CREATE POLICY "Allow public read for treasurer aggregation"
ON public.fiscal_user_reviews
FOR SELECT
USING (true);