import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CooperadoReport {
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

export const useCooperadoReports = () => {
  return useQuery({
    queryKey: ['cooperado-reports'],
    queryFn: async () => {
      console.log('Buscando relatórios enviados para cooperado...');
      const { data, error } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('sent_to_cooperado', true)
        .eq('is_active', true)
        .is('dashboard_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar relatórios do cooperado:', error);
        throw error;
      }
      console.log('Relatórios do cooperado encontrados:', data?.length || 0);
      return data as CooperadoReport[];
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};
