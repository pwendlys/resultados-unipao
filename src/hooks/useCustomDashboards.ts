import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardPersonalizado {
  id: string;
  nome: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export const useCustomDashboards = () => {
  return useQuery({
    queryKey: ['dashboards-personalizados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboards_personalizados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DashboardPersonalizado[];
    }
  });
};

export const useCustomDashboardsActions = () => {
  const queryClient = useQueryClient();

  const createDashboard = useMutation({
    mutationFn: async (dashboard: Omit<DashboardPersonalizado, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('dashboards_personalizados')
        .insert(dashboard)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards-personalizados'] });
    }
  });

  const deleteDashboard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dashboards_personalizados')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards-personalizados'] });
      queryClient.invalidateQueries({ queryKey: ['entradas-personalizadas'] });
    }
  });

  return {
    createDashboard,
    deleteDashboard
  };
};