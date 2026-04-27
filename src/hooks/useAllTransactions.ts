// ============================================================
// Hook Dedicado: Buscar TODAS as transações com paginação
// Usado exclusivamente pelo módulo "Relatórios Personalizados"
// (CustomReports) para garantir que TODOS os meses apareçam,
// contornando o limite default de 1000 linhas do PostgREST.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Transaction } from './useSupabaseData';

export const useAllTransactions = () => {
  return useQuery({
    queryKey: ['all-transactions-paginated'],
    queryFn: async () => {
      console.log('🔄 useAllTransactions - Iniciando busca PAGINADA de TODAS as transações...');

      const PAGE_SIZE = 1000;
      let allTransactions: Transaction[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        console.log(`📄 [useAllTransactions] Página ${page + 1}: registros ${from} a ${to}`);

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
          console.error('❌ [useAllTransactions] Erro ao buscar transações:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allTransactions = [...allTransactions, ...(data as Transaction[])];
          console.log(
            `✅ [useAllTransactions] Página ${page + 1}: ${data.length} (acumulado: ${allTransactions.length})`
          );

          if (data.length < PAGE_SIZE) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        page++;

        // Segurança contra loop infinito
        if (page > 100) {
          console.warn('⚠️ [useAllTransactions] Limite de 100 páginas atingido');
          hasMore = false;
        }
      }

      console.log(`🎉 [useAllTransactions] BUSCA COMPLETA! Total: ${allTransactions.length} transações`);
      return allTransactions;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
};
