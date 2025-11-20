-- Adicionar campo sent_to_cooperado à tabela shared_reports
ALTER TABLE shared_reports 
ADD COLUMN sent_to_cooperado BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance nas consultas
CREATE INDEX idx_shared_reports_cooperado ON shared_reports(sent_to_cooperado, is_active) 
WHERE sent_to_cooperado = true AND is_active = true;