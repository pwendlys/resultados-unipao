
-- Limpar todos os dados das tabelas (mantendo a estrutura)
DELETE FROM public.transactions;
DELETE FROM public.extratos;

-- Resetar as sequences se necessário
-- (O PostgreSQL manterá os UUIDs únicos automaticamente)

-- Verificar se as tabelas estão vazias (opcional - descomente para verificar)
-- SELECT COUNT(*) as transactions_count FROM public.transactions;
-- SELECT COUNT(*) as extratos_count FROM public.extratos;
-- SELECT COUNT(*) as categories_count FROM public.categories;
