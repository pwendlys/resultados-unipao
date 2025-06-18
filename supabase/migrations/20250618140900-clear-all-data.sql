
-- Limpar todos os dados das tabelas
DELETE FROM public.transactions;
DELETE FROM public.extratos;

-- Resetar as sequences se necessário
-- (O PostgreSQL manterá os UUIDs únicos automaticamente)

-- Verificar se as tabelas estão vazias
-- SELECT COUNT(*) FROM public.transactions;
-- SELECT COUNT(*) FROM public.extratos;
-- SELECT COUNT(*) FROM public.categories;
