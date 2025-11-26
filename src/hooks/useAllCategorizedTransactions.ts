// ============================================================
// Hook Dedicado: Buscar TODAS transações categorizadas
// Usado exclusivamente pela funcionalidade "Relatórios Enviar"
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CategorizedTransaction {
  id: string;
  extrato_id: string | null;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  category: string | null;
  status: string;
  juros: number | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

// Hook que busca EXCLUSIVAMENTE transações categorizadas com paginação automática
export const useAllCategorizedTransactions = () => {
  return useQuery({
    queryKey: ['all-categorized-transactions'],
    queryFn: async () => {
      console.log('🔄 useAllCategorizedTransactions - Iniciando busca PAGINADA...');
      
      const PAGE_SIZE = 1000;
      let allTransactions: CategorizedTransaction[] = [];
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        
        console.log(`📄 Buscando página ${page + 1}: registros ${from} a ${to}`);
        
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('status', 'categorizado')
          .order('date', { ascending: false })
          .range(from, to);
        
        if (error) {
          console.error('❌ Erro ao buscar transações categorizadas:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allTransactions = [...allTransactions, ...(data as CategorizedTransaction[])];
          console.log(`✅ Página ${page + 1}: ${data.length} transações (total acumulado: ${allTransactions.length})`);
          
          // Se retornou menos que PAGE_SIZE, não há mais páginas
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        page++;
        
        // Segurança: evitar loop infinito
        if (page > 100) {
          console.warn('⚠️ Limite de 100 páginas atingido');
          hasMore = false;
        }
      }
      
      console.log(`🎉 BUSCA COMPLETA! Total: ${allTransactions.length} transações categorizadas`);
      console.log(`📅 Transações mais recentes:`, allTransactions.slice(0, 3).map(t => t.date));
      console.log(`📅 Transações mais antigas:`, allTransactions.slice(-3).map(t => t.date));
      
      return allTransactions;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
