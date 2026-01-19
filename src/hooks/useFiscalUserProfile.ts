import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalUserProfile {
  id: string;
  user_id: string;
  default_signature_data: string | null;
  default_signature_updated_at: string | null;
  created_at: string;
}

export const useFiscalUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ['fiscal-user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('fiscal_user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching fiscal user profile:', error);
        // Don't throw - profile might not exist yet
        return null;
      }

      return data as FiscalUserProfile | null;
    },
    enabled: !!userId,
  });
};

export const useSaveDefaultSignature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      signatureData,
    }: {
      userId: string;
      signatureData: string;
    }) => {
      // Try to upsert the profile with default signature
      const { error } = await supabase
        .from('fiscal_user_profiles')
        .upsert(
          {
            user_id: userId,
            default_signature_data: signatureData,
            default_signature_updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.error('Error saving default signature:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-user-profile', variables.userId] });
    },
  });
};
