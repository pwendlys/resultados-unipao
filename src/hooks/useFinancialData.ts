import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentoFinanceiro {
  id: string;
  nome: string;
  tipo_documento: 'contas_a_receber' | 'contas_a_pagar' | 'contas_vencidas' | 'fluxo_caixa';
  arquivo_original: string;
  periodo: string;
  banco?: string;
  valor_total: number;
  quantidade_documentos: number;
  status: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemFinanceiro {
  id: string;
  documento_id: string;
  descricao: string;
  valor: number;
  data_vencimento?: string;
  data_emissao?: string;
  numero_documento?: string;
  categoria?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  observacao?: string;
  juros: number;
  multa: number;
  valor_pago?: number;
  data_pagamento?: string;
  created_at: string;
  updated_at: string;
}

// Hook para buscar documentos financeiros
export const useDocumentosFinanceiros = () => {
  return useQuery({
    queryKey: ['documentos-financeiros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_financeiros')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocumentoFinanceiro[];
    },
  });
};

// Hook para buscar itens financeiros por documento
export const useItensFinanceiros = (documentoId?: string) => {
  return useQuery({
    queryKey: ['itens-financeiros', documentoId],
    queryFn: async () => {
      let query = supabase
        .from('itens_financeiros')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (documentoId) {
        query = query.eq('documento_id', documentoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ItemFinanceiro[];
    },
    enabled: !!documentoId,
  });
};

// Hook para buscar todos os itens financeiros
export const useAllItensFinanceiros = () => {
  return useQuery({
    queryKey: ['all-itens-financeiros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itens_financeiros')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      return data as ItemFinanceiro[];
    },
  });
};

// Hook para ações nos documentos financeiros
export const useDocumentosFinanceirosActions = () => {
  const queryClient = useQueryClient();

  const createDocumento = useMutation({
    mutationFn: async (documento: Omit<DocumentoFinanceiro, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('documentos_financeiros')
        .insert(documento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-financeiros'] });
      toast.success('Documento financeiro criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar documento financeiro:', error);
      toast.error('Erro ao criar documento financeiro');
    },
  });

  const updateDocumento = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DocumentoFinanceiro> & { id: string }) => {
      const { data, error } = await supabase
        .from('documentos_financeiros')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-financeiros'] });
      toast.success('Documento financeiro atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar documento financeiro:', error);
      toast.error('Erro ao atualizar documento financeiro');
    },
  });

  const deleteDocumento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documentos_financeiros')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['itens-financeiros'] });
      toast.success('Documento financeiro excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir documento financeiro:', error);
      toast.error('Erro ao excluir documento financeiro');
    },
  });

  return {
    createDocumento,
    updateDocumento,
    deleteDocumento,
  };
};

// Hook para ações nos itens financeiros
export const useItensFinanceirosActions = () => {
  const queryClient = useQueryClient();

  const createItens = useMutation({
    mutationFn: async (itens: Omit<ItemFinanceiro, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('itens_financeiros')
        .insert(itens)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['all-itens-financeiros'] });
      toast.success('Itens financeiros criados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar itens financeiros:', error);
      toast.error('Erro ao criar itens financeiros');
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ItemFinanceiro> & { id: string }) => {
      const { data, error } = await supabase
        .from('itens_financeiros')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['all-itens-financeiros'] });
      toast.success('Item financeiro atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar item financeiro:', error);
      toast.error('Erro ao atualizar item financeiro');
    },
  });

  const bulkUpdateItens = useMutation({
    mutationFn: async (updates: { id: string; status: string }[]) => {
      const promises = updates.map(({ id, status }) =>
        supabase
          .from('itens_financeiros')
          .update({ status })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Erro ao atualizar alguns itens');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['all-itens-financeiros'] });
      toast.success('Itens atualizados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar itens:', error);
      toast.error('Erro ao atualizar itens');
    },
  });

  return {
    createItens,
    updateItem,
    bulkUpdateItens,
  };
};