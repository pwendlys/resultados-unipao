
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types para os dados
export interface Extrato {
  id: string;
  name: string;
  size: string;
  period: string;
  bank: string;
  file_type: string;
  status: string;
  transactions_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  extrato_id?: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  category?: string;
  status: 'pendente' | 'categorizado';
  suggested: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'entrada' | 'saida';
  created_at: string;
}

// Hook para extratos
export const useExtratos = () => {
  return useQuery({
    queryKey: ['extratos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extratos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Extrato[];
    },
  });
};

// Hook para transações
export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnMount: true, // Refetch ao montar o componente
  });
};

// Hook para categorias
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
};

// Hook para mutações de extratos
export const useExtratosActions = () => {
  const queryClient = useQueryClient();

  const createExtrato = useMutation({
    mutationFn: async (extrato: Omit<Extrato, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('extratos')
        .insert(extrato)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extratos'] });
    },
  });

  const updateExtrato = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Extrato> & { id: string }) => {
      const { data, error } = await supabase
        .from('extratos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extratos'] });
    },
  });

  return { createExtrato, updateExtrato };
};

// Hook para mutações de transações
export const useTransactionsActions = () => {
  const queryClient = useQueryClient();

  const createTransactions = useMutation({
    mutationFn: async (transactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[]) => {
      console.log('Creating transactions:', transactions.length);
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactions)
        .select();
      
      if (error) {
        console.error('Error creating transactions:', error);
        throw error;
      }
      console.log('Transactions created successfully:', data.length);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating transactions query after creating', data.length, 'transactions');
      // Invalidar ambas as queries para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.refetchQueries({ queryKey: ['transactions'] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const bulkUpdateTransactions = useMutation({
    mutationFn: async (updates: { id: string; category: string; status: string }[]) => {
      const promises = updates.map(update => 
        supabase
          .from('transactions')
          .update({ category: update.category, status: update.status })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Erro ao atualizar ${errors.length} transações`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return { createTransactions, updateTransaction, bulkUpdateTransactions };
};
