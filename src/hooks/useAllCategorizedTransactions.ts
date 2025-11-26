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

// Hook que busca EXCLUSIVAMENTE transações categorizadas
export const useAllCategorizedTransactions = () => {
  return useQuery({
    queryKey: ['all-categorized-transactions'],
    queryFn: async () => {
      console.log('🔄 useAllCategorizedTransactions - Buscando transações categorizadas...');
      
      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('status', 'categorizado')
        .range(0, 49999)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar transações categorizadas:', error);
        throw error;
      }
      
      console.log(`✅ Transações categorizadas carregadas: ${data?.length || 0}`);
      console.log(`📊 Total no banco (count): ${count}`);
      console.log(`📅 Amostra de datas:`, data?.slice(0, 3).map(t => t.date));
      
      return data as CategorizedTransaction[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
