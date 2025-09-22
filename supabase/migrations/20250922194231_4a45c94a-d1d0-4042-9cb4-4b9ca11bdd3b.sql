-- Update constraint to allow 'fluxo_caixa' as a valid document type
ALTER TABLE documentos_financeiros 
DROP CONSTRAINT documentos_financeiros_tipo_documento_check;

ALTER TABLE documentos_financeiros 
ADD CONSTRAINT documentos_financeiros_tipo_documento_check 
CHECK (tipo_documento = ANY (ARRAY['contas_a_receber'::text, 'contas_a_pagar'::text, 'contas_vencidas'::text, 'fluxo_caixa'::text]));