import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EntradaPersonalizada {
  id: string;
  dashboard_id: string;
  ano: number;
  mes: number;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export const useCustomEntries = (dashboardId?: string) => {
  return useQuery({
    queryKey: ['entradas-personalizadas', dashboardId],
    queryFn: async () => {
      if (!dashboardId) return [];
      
      const { data, error } = await supabase
        .from('entradas_personalizadas')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (error) throw error;
      return data as EntradaPersonalizada[];
    },
    enabled: !!dashboardId
  });
};

export const useCustomEntriesActions = () => {
  const queryClient = useQueryClient();

  const createEntry = useMutation({
    mutationFn: async (entry: Omit<EntradaPersonalizada, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('entradas_personalizadas')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entradas-personalizadas', variables.dashboard_id] });
    }
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EntradaPersonalizada> & { id: string }) => {
      const { data, error } = await supabase
        .from('entradas_personalizadas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entradas-personalizadas', data.dashboard_id] });
    }
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('entradas_personalizadas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['entradas-personalizadas'] });
    }
  });

  return {
    createEntry,
    updateEntry,
    deleteEntry
  };
};