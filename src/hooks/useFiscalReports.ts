import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FiscalReport {
  id: string;
  extrato_id: string | null;
  title: string;
  status: 'open' | 'locked' | 'finished';
  competencia: string;
  account_type: string;
  sent_at: string;
  sent_by: string | null;
  pdf_url: string | null;
  total_entries: number;
  approved_count: number;
  flagged_count: number;
  pending_count: number;
  created_at: string;
  updated_at: string;
  extratos?: {
    name: string;
    bank: string;
    period: string;
  } | null;
}

export interface FiscalReportAssignee {
  id: string;
  fiscal_report_id: string;
  fiscal_user_id: string;
  created_at: string;
}

export const useFiscalReports = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fiscal-reports', user?.email],
    queryFn: async () => {
      console.log('Fetching fiscal reports for user:', user?.email);
      
      // Buscar relatórios atribuídos ao usuário atual
      const { data: assignees, error: assigneesError } = await supabase
        .from('fiscal_report_assignees')
        .select('fiscal_report_id')
        .eq('fiscal_user_id', user?.email || '');

      if (assigneesError) {
        console.error('Error fetching assignees:', assigneesError);
        throw assigneesError;
      }

      const reportIds = assignees?.map(a => a.fiscal_report_id) || [];
      
      if (reportIds.length === 0) {
        // Se for admin, buscar todos os relatórios
        if (user?.role === 'admin') {
          const { data, error } = await supabase
            .from('fiscal_reports')
            .select(`
              *,
              extratos (
                name,
                bank,
                period
              )
            `)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data as FiscalReport[];
        }
        return [];
      }

      const { data, error } = await supabase
        .from('fiscal_reports')
        .select(`
          *,
          extratos (
            name,
            bank,
            period
          )
        `)
        .in('id', reportIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fiscal reports:', error);
        throw error;
      }

      console.log('Fiscal reports fetched:', data?.length);
      return data as FiscalReport[];
    },
    enabled: !!user?.email,
  });
};

export const useAllFiscalReports = () => {
  return useQuery({
    queryKey: ['all-fiscal-reports'],
    queryFn: async () => {
      console.log('Fetching all fiscal reports');
      
      const { data, error } = await supabase
        .from('fiscal_reports')
        .select(`
          *,
          extratos (
            name,
            bank,
            period
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all fiscal reports:', error);
        throw error;
      }

      console.log('All fiscal reports fetched:', data?.length);
      return data as FiscalReport[];
    },
  });
};

export const useFiscalReportById = (reportId: string | undefined) => {
  return useQuery({
    queryKey: ['fiscal-report', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      
      const { data, error } = await supabase
        .from('fiscal_reports')
        .select(`
          *,
          extratos (
            name,
            bank,
            period
          )
        `)
        .eq('id', reportId)
        .maybeSingle();

      if (error) throw error;
      return data as FiscalReport | null;
    },
    enabled: !!reportId,
  });
};

export const useFiscalReportsActions = () => {
  const queryClient = useQueryClient();

  const createFiscalReport = useMutation({
    mutationFn: async (data: {
      extrato_id: string;
      title: string;
      competencia: string;
      account_type: string;
      sent_by: string;
      total_entries: number;
    }) => {
      const { data: report, error } = await supabase
        .from('fiscal_reports')
        .insert({
          extrato_id: data.extrato_id,
          title: data.title,
          competencia: data.competencia,
          account_type: data.account_type,
          sent_by: data.sent_by,
          total_entries: data.total_entries,
          pending_count: data.total_entries,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-reports'] });
      queryClient.invalidateQueries({ queryKey: ['all-fiscal-reports'] });
    },
  });

  const createFiscalAssignees = useMutation({
    mutationFn: async (data: { fiscal_report_id: string; fiscal_user_ids: string[] }) => {
      const assignees = data.fiscal_user_ids.map(userId => ({
        fiscal_report_id: data.fiscal_report_id,
        fiscal_user_id: userId,
      }));

      const { error } = await supabase
        .from('fiscal_report_assignees')
        .insert(assignees);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-reports'] });
    },
  });

  const updateFiscalReportStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'open' | 'locked' | 'finished' }) => {
      const { error } = await supabase
        .from('fiscal_reports')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-reports'] });
      queryClient.invalidateQueries({ queryKey: ['all-fiscal-reports'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-report'] });
    },
  });

  return {
    createFiscalReport,
    createFiscalAssignees,
    updateFiscalReportStatus,
  };
};
