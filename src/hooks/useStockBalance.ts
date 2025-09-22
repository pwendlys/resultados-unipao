import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BalancoEstoque {
  id: string;
  nome: string;
  periodo: string;
  total_itens: number;
  itens_negativos: number;
  itens_positivos: number;
  itens_neutros: number;
  resultado_monetario: number;
  status: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemBalanco {
  id: string;
  balanco_id: string;
  codigo?: string;
  descricao?: string;
  quantidade_sistema?: number;
  quantidade_real?: number;
  diferenca_quantidade?: number;
  unitario?: number;
  valor_sistema?: number;
  valor_real?: number;
  diferenca_monetaria?: number;
  created_at: string;
}

export interface MapeamentoColunas {
  id: string;
  user_id: string;
  mapeamento: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export function useBalancosEstoque() {
  return useQuery({
    queryKey: ['balancos-estoque'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('balancos_estoque')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BalancoEstoque[];
    }
  });
}

export function useItensBalanco(balancoId?: string) {
  return useQuery({
    queryKey: ['itens-balanco', balancoId],
    queryFn: async () => {
      if (!balancoId) return [];
      
      const { data, error } = await supabase
        .from('itens_balanco')
        .select('*')
        .eq('balanco_id', balancoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ItemBalanco[];
    },
    enabled: !!balancoId
  });
}

export function useMapeamentoColunas() {
  return useQuery({
    queryKey: ['mapeamento-colunas-balanco'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mapeamentos_colunas_balanco')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as MapeamentoColunas | null;
    }
  });
}