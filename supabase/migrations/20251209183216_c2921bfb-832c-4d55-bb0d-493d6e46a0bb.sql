-- Adicionar coluna balanço na tabela ativos_passivos
ALTER TABLE ativos_passivos 
ADD COLUMN balanco numeric DEFAULT 0;