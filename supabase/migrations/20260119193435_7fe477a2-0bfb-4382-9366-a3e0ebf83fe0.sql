-- Adicionar campos para rastrear quem criou a diligência e quando
ALTER TABLE fiscal_user_reviews 
ADD COLUMN IF NOT EXISTS diligence_created_by uuid NULL,
ADD COLUMN IF NOT EXISTS diligence_created_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS diligence_creator_name text NULL;

-- Comentários
COMMENT ON COLUMN fiscal_user_reviews.diligence_created_by IS 'UUID do fiscal que marcou a transação como divergente';
COMMENT ON COLUMN fiscal_user_reviews.diligence_created_at IS 'Data/hora em que a diligência foi criada';
COMMENT ON COLUMN fiscal_user_reviews.diligence_creator_name IS 'Nome/email do fiscal que criou a diligência (cache para exibição)';