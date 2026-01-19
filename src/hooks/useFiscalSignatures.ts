import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalSignature {
  id: string;
  report_id: string;
  user_id: string;
  signature_data: string;
  display_name: string | null;
  created_at: string;
}

export const useFiscalSignatures = (reportId: string | undefined) => {
  return useQuery({
    queryKey: ['fiscal-signatures', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      
      const { data, error } = await supabase
        .from('fiscal_report_signatures')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching fiscal signatures:', error);
        throw error;
      }

      return data as FiscalSignature[];
    },
    enabled: !!reportId,
  });
};

export const useFiscalSignaturesActions = () => {
  const queryClient = useQueryClient();

  const createSignature = useMutation({
    mutationFn: async ({
      reportId,
      userId,
      signatureData,
      displayName
    }: {
      reportId: string;
      userId: string;
      signatureData: string;
      displayName?: string;
    }) => {
      const { error } = await supabase
        .from('fiscal_report_signatures')
        .insert({
          report_id: reportId,
          user_id: userId,
          signature_data: signatureData,
          display_name: displayName || null,
        });

      if (error) {
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          throw new Error('Você já assinou este relatório.');
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-signatures', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-reports'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-report'] });
    },
  });

  return {
    createSignature,
  };
};

export const useHasUserSigned = (reportId: string | undefined, userId: string | undefined) => {
  const { data: signatures = [] } = useFiscalSignatures(reportId);
  
  if (!userId) return false;
  return signatures.some(sig => sig.user_id === userId);
};

export const useSignatureCount = (reportId: string | undefined) => {
  const { data: signatures = [] } = useFiscalSignatures(reportId);
  return signatures.length;
};
