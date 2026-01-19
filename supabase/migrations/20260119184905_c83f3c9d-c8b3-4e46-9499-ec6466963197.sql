-- Remover política atual que é restritiva demais para SELECT
DROP POLICY IF EXISTS "Fiscal can manage own reviews" ON fiscal_user_reviews;

-- Política para SELECT: todos fiscais/admins podem ler todas as aprovações (para agregação X/3)
CREATE POLICY "Fiscal can read all reviews for aggregation"
ON fiscal_user_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'fiscal')
  )
);

-- Política para INSERT: fiscais só podem inserir seus próprios registros
CREATE POLICY "Fiscal can insert own reviews"
ON fiscal_user_reviews
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Política para UPDATE: fiscais só podem atualizar seus próprios registros
CREATE POLICY "Fiscal can update own reviews"
ON fiscal_user_reviews
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política para DELETE: fiscais só podem deletar seus próprios registros
CREATE POLICY "Fiscal can delete own reviews"
ON fiscal_user_reviews
FOR DELETE
USING (user_id = auth.uid());