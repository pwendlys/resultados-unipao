import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SharedDashboard {
  id: string;
  title: string;
  config: any;
  data: any;
  share_id: string;
  dashboard_id: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
}

export const useSharedDashboards = () => {
  return useQuery({
    queryKey: ['shared-dashboards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_reports')
        .select('*')
        .not('dashboard_id', 'is', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SharedDashboard[];
    }
  });
};

export const useSharedDashboard = (shareId: string) => {
  return useQuery({
    queryKey: ['shared-dashboard', shareId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('share_id', shareId)
        .not('dashboard_id', 'is', null)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as SharedDashboard | null;
    },
    enabled: !!shareId
  });
};

export const useSharedDashboardsActions = () => {
  const queryClient = useQueryClient();

  const createSharedDashboard = useMutation({
    mutationFn: async (dashboardData: {
      title: string;
      config: any;
      data: any;
      share_id: string;
      dashboard_id: string;
      expires_at?: string;
    }) => {
      const { data, error } = await supabase
        .from('shared_reports')
        .insert({
          title: dashboardData.title,
          config: dashboardData.config,
          data: dashboardData.data,
          share_id: dashboardData.share_id,
          dashboard_id: dashboardData.dashboard_id,
          expires_at: dashboardData.expires_at,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-dashboards'] });
    }
  });

  const updateSharedDashboard = useMutation({
    mutationFn: async (updates: Partial<SharedDashboard> & { id: string }) => {
      const { id, ...updateData } = updates;
      const { data, error } = await supabase
        .from('shared_reports')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-dashboards'] });
    }
  });

  const deleteSharedDashboard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shared_reports')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-dashboards'] });
    }
  });

  return {
    createSharedDashboard,
    updateSharedDashboard,
    deleteSharedDashboard
  };
};