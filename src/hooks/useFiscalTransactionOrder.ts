import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalTransactionOrder {
  id: string;
  report_id: string;
  transaction_id: string;
  sort_index: number;
  matched: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch custom transaction order for a report (from PDF parsing)
export const useFiscalTransactionOrder = (reportId: string | undefined) => {
  return useQuery({
    queryKey: ['fiscal-transaction-order', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      
      const { data, error } = await supabase
        .from('fiscal_report_transaction_order')
        .select('*')
        .eq('report_id', reportId)
        .order('sort_index', { ascending: true });

      if (error) {
        // If table doesn't exist yet or other error, return empty
        console.warn('Error fetching transaction order:', error);
        return [];
      }

      return data as FiscalTransactionOrder[];
    },
    enabled: !!reportId,
  });
};

// Invalidate order query (for use after PDF processing)
export const useInvalidateTransactionOrder = () => {
  const queryClient = useQueryClient();
  
  return (reportId: string) => {
    queryClient.invalidateQueries({ queryKey: ['fiscal-transaction-order', reportId] });
  };
};