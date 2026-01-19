-- Add diligence_ack column to track fiscal's acknowledgment of diligence
ALTER TABLE fiscal_user_reviews 
ADD COLUMN diligence_ack boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN fiscal_user_reviews.diligence_ack IS 
  'Indicates if the fiscal has acknowledged/confirmed awareness of an active diligence on this transaction';