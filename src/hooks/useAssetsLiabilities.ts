import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AssetsLiabilities {
  id: string;
  user_id?: string;
  saldo_do_dia: number;
  a_receber: number;
  vencida: number;
  estoque: number;
  investimento: number;
  a_pagar: number;
  joia: number;
  aporte: number;
  data_referencia: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export function useAssetsLiabilities() {
  return useQuery({
    queryKey: ['assets-liabilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ativos_passivos')
        .select('*')
        .order('data_referencia', { ascending: false });
      
      if (error) throw error;
      return data as AssetsLiabilities[];
    }
  });
}
