-- Adicionar coluna tipo_balanco na tabela balancos_estoque
-- Esta migration é segura e não altera funcionalidades existentes
ALTER TABLE public.balancos_estoque 
ADD COLUMN tipo_balanco TEXT NOT NULL DEFAULT 'estoque';

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.balancos_estoque.tipo_balanco IS 'Tipo do balanço: estoque (padrão) ou perdas/avarias';

-- Criar índice para performance nas consultas por tipo
CREATE INDEX idx_balancos_estoque_tipo_balanco ON public.balancos_estoque(tipo_balanco);