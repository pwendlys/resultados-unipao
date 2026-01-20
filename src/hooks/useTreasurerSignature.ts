import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TreasurerSignature {
  id: string;
  report_id: string;
  user_id: string;
  signature_data: string;
  display_name: string | null;
  signed_at: string;
  created_at: string;
}

// Fetch treasurer signature for a specific report
export const useTreasurerSignature = (reportId: string | null) => {
  return useQuery({
    queryKey: ['treasurer-signature', reportId],
    queryFn: async (): Promise<TreasurerSignature | null> => {
      if (!reportId) return null;

      const { data, error } = await supabase
        .from('treasurer_signatures')
        .select('*')
        .eq('report_id', reportId)
        .maybeSingle();

      if (error) {
        console.error('[TreasurerSignature] Error fetching:', error);
        throw error;
      }

      return data as TreasurerSignature | null;
    },
    enabled: !!reportId,
  });
};

// Hook to create a treasurer signature
export const useTreasurerSignatureActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createSignature = useMutation({
    mutationFn: async ({
      reportId,
      signatureData,
      displayName,
    }: {
      reportId: string;
      signatureData: string;
      displayName?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('treasurer_signatures')
        .insert({
          report_id: reportId,
          user_id: session.user.id,
          signature_data: signatureData,
          display_name: displayName || session.user.email,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate key error
        if (error.code === '23505') {
          throw new Error('Você já assinou este relatório como tesoureiro.');
        }
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['treasurer-signature', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['treasurer-reports-summary'] });
      queryClient.invalidateQueries({ queryKey: ['all-fiscal-reports'] });
      
      toast({
        title: 'Assinatura registrada',
        description: 'Sua assinatura como tesoureiro foi salva com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao assinar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { createSignature };
};

// Hook to check if treasurer has signed a specific report
export const useHasTreasurerSigned = (reportId: string | null) => {
  const { data: signature, isLoading } = useTreasurerSignature(reportId);
  return {
    hasSigned: !!signature,
    signature,
    isLoading,
  };
};
