import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { BalancoEstoque, ItemBalanco, MapeamentoColunas } from './useStockBalance';
import type { StockBalanceItem } from '@/utils/stockBalanceProcessor';

export function useStockBalanceActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createBalanco = useMutation({
    mutationFn: async (balanco: Omit<BalancoEstoque, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('balancos_estoque')
        .insert(balanco)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balancos-estoque'] });
      toast({
        title: "Sucesso",
        description: "Balanço de estoque criado com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar balanço: " + error.message,
        variant: "destructive"
      });
    }
  });

  const createItens = useMutation({
    mutationFn: async ({ balancoId, items }: { balancoId: string; items: StockBalanceItem[] }) => {
      const itensParaInserir = items.map(item => ({
        balanco_id: balancoId,
        ...item
      }));
      
      const { data, error } = await supabase
        .from('itens_balanco')
        .insert(itensParaInserir)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itens-balanco', variables.balancoId] });
      toast({
        title: "Sucesso",
        description: "Itens do balanço importados com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao importar itens: " + error.message,
        variant: "destructive"
      });
    }
  });

  const saveMapeamento = useMutation({
    mutationFn: async (mapeamento: Record<string, string>) => {
      // Try to update existing mapping first
      const { data: existing } = await supabase
        .from('mapeamentos_colunas_balanco')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('mapeamentos_colunas_balanco')
          .update({ mapeamento, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('mapeamentos_colunas_balanco')
          .insert({ 
            user_id: 'system', // Will be updated when authentication is implemented
            mapeamento 
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapeamento-colunas-balanco'] });
    }
  });

  const deleteBalanco = useMutation({
    mutationFn: async (id: string) => {
      // Delete items first
      await supabase
        .from('itens_balanco')
        .delete()
        .eq('balanco_id', id);
      
      // Then delete the balance
      const { error } = await supabase
        .from('balancos_estoque')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balancos-estoque'] });
      queryClient.invalidateQueries({ queryKey: ['itens-balanco'] });
      toast({
        title: "Sucesso",
        description: "Balanço excluído com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir balanço: " + error.message,
        variant: "destructive"
      });
    }
  });

  return {
    createBalanco,
    createItens,
    saveMapeamento,
    deleteBalanco
  };
}