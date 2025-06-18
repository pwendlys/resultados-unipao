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
      console.log('Fetching extratos from database...');
      const { data, error } = await supabase
        .from('extratos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching extratos:', error);
        throw error;
      }
      console.log('Extratos fetched:', data?.length || 0);
      return data as Extrato[];
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};

// Hook para transações
export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      console.log('Fetching transactions from database...');
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      console.log('Transactions fetched:', data?.length || 0);
      return data as Transaction[];
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};

// Hook para categorias
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories from database...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      console.log('Categories fetched:', data?.length || 0);
      return data as Category[];
    },
  });
};

// Hook para mutações de extratos
export const useExtratosActions = () => {
  const queryClient = useQueryClient();

  const createExtrato = useMutation({
    mutationFn: async (extrato: Omit<Extrato, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('Creating extrato:', extrato);
      const { data, error } = await supabase
        .from('extratos')
        .insert(extrato)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating extrato:', error);
        throw error;
      }
      console.log('Extrato created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating extratos queries after creating extrato:', data.id);
      queryClient.invalidateQueries({ queryKey: ['extratos'] });
      queryClient.refetchQueries({ queryKey: ['extratos'] });
    },
  });

  const updateExtrato = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Extrato> & { id: string }) => {
      console.log('Updating extrato:', id, updates);
      const { data, error } = await supabase
        .from('extratos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating extrato:', error);
        throw error;
      }
      console.log('Extrato updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating extratos queries after updating extrato:', data.id);
      queryClient.invalidateQueries({ queryKey: ['extratos'] });
      queryClient.refetchQueries({ queryKey: ['extratos'] });
    },
  });

  const deleteExtrato = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting extrato:', id);
      
      // Primeiro deletar todas as transações relacionadas
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('extrato_id', id);
      
      if (transactionsError) {
        console.error('Error deleting transactions:', transactionsError);
        throw transactionsError;
      }
      
      // Depois deletar o extrato
      const { data, error } = await supabase
        .from('extratos')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error deleting extrato:', error);
        throw error;
      }
      console.log('Extrato deleted successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating queries after deleting extrato:', data.id);
      queryClient.invalidateQueries({ queryKey: ['extratos'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return { createExtrato, updateExtrato, deleteExtrato };
};

// Hook para mutações de transações
export const useTransactionsActions = () => {
  const queryClient = useQueryClient();

  const createTransactions = useMutation({
    mutationFn: async (transactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[]) => {
      console.log('Creating transactions in batch:', transactions.length);
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
      console.log('Invalidating transactions queries after creating', data.length, 'transactions');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.refetchQueries({ queryKey: ['transactions'] });
      // Também invalidar extratos pois o count pode ter mudado
      queryClient.invalidateQueries({ queryKey: ['extratos'] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      console.log('Updating transaction:', id, updates);
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating transaction:', error);
        throw error;
      }
      console.log('Transaction updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidating transactions queries after updating transaction:', data.id);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const bulkUpdateTransactions = useMutation({
    mutationFn: async (updates: { id: string; category: string; status: string }[]) => {
      console.log('Bulk updating transactions:', updates.length);
      const promises = updates.map(update => 
        supabase
          .from('transactions')
          .update({ category: update.category, status: update.status })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error('Errors in bulk update:', errors);
        throw new Error(`Erro ao atualizar ${errors.length} transações`);
      }
      
      console.log('Bulk update completed successfully');
      return results;
    },
    onSuccess: () => {
      console.log('Invalidating transactions queries after bulk update');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return { createTransactions, updateTransaction, bulkUpdateTransactions };
};
