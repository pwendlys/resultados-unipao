
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SharedReport {
  id: string;
  title: string;
  config: any;
  data: any;
  share_id: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
}

// Hook para buscar relatórios compartilhados
export const useSharedReports = () => {
  return useQuery({
    queryKey: ['shared-reports'],
    queryFn: async () => {
      console.log('Fetching shared reports from database...');
      const { data, error } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching shared reports:', error);
        throw error;
      }
      console.log('Shared reports fetched:', data?.length || 0);
      return data as SharedReport[];
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};

// Hook para buscar um relatório compartilhado específico
export const useSharedReport = (shareId: string) => {
  return useQuery({
    queryKey: ['shared-report', shareId],
    queryFn: async () => {
      console.log('Fetching shared report by share_id:', shareId);
      const { data, error } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('share_id', shareId)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching shared report:', error);
        throw error;
      }
      console.log('Shared report fetched:', data);
      return data as SharedReport;
    },
    enabled: !!shareId,
  });
};

// Hook para ações com relatórios compartilhados
export const useSharedReportsActions = () => {
  const queryClient = useQueryClient();

  const createSharedReport = useMutation({
    mutationFn: async (reportData: {
      title: string;
      config: any;
      data: any;
      share_id: string;
      expires_at?: string;
    }) => {
      console.log('Creating shared report:', reportData);
      const { data, error } = await supabase
        .from('shared_reports')
        .insert(reportData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating shared report:', error);
        throw error;
      }
      console.log('Shared report created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        console.log('Invalidating shared reports queries after creating report:', data.id);
        queryClient.invalidateQueries({ queryKey: ['shared-reports'] });
      }
    },
  });

  const updateSharedReport = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SharedReport> & { id: string }) => {
      console.log('Updating shared report:', id, updates);
      const { data, error } = await supabase
        .from('shared_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating shared report:', error);
        throw error;
      }
      console.log('Shared report updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        console.log('Invalidating shared reports queries after updating report:', data.id);
        queryClient.invalidateQueries({ queryKey: ['shared-reports'] });
        queryClient.invalidateQueries({ queryKey: ['shared-report', data.share_id] });
      }
    },
  });

  const deleteSharedReport = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deactivating shared report:', id);
      const { data, error } = await supabase
        .from('shared_reports')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error deactivating shared report:', error);
        throw error;
      }
      console.log('Shared report deactivated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        console.log('Invalidating shared reports queries after deactivating report:', data.id);
        queryClient.invalidateQueries({ queryKey: ['shared-reports'] });
      }
    },
  });

  return { createSharedReport, updateSharedReport, deleteSharedReport };
};
