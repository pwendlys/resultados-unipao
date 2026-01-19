import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalUserReview {
  id: string;
  report_id: string;
  transaction_id: string;
  user_id: string;
  status: 'approved' | 'divergent';
  observation: string | null;
  created_at: string;
  updated_at: string;
}

// Hook to get the current fiscal user's reviews for a report
export const useFiscalUserReviews = (reportId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ['fiscal-user-reviews', reportId, userId],
    queryFn: async () => {
      if (!reportId || !userId) return [];
      
      const { data, error } = await supabase
        .from('fiscal_user_reviews')
        .select('*')
        .eq('report_id', reportId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching fiscal user reviews:', error);
        throw error;
      }

      return data as FiscalUserReview[];
    },
    enabled: !!reportId && !!userId,
  });
};

// Hook to get approval counts for all transactions in a report
export const useTransactionApprovalCounts = (reportId: string | undefined) => {
  return useQuery({
    queryKey: ['transaction-approval-counts', reportId],
    queryFn: async () => {
      if (!reportId) return {};
      
      const { data, error } = await supabase
        .from('fiscal_user_reviews')
        .select('transaction_id, user_id')
        .eq('report_id', reportId)
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching transaction approval counts:', error);
        throw error;
      }

      // Group by transaction_id and count unique users
      const counts: Record<string, number> = {};
      const seenUsers: Record<string, Set<string>> = {};
      
      for (const item of data || []) {
        if (!seenUsers[item.transaction_id]) {
          seenUsers[item.transaction_id] = new Set();
        }
        seenUsers[item.transaction_id].add(item.user_id);
      }
      
      for (const [txId, users] of Object.entries(seenUsers)) {
        counts[txId] = users.size;
      }

      return counts;
    },
    enabled: !!reportId,
  });
};

export const useFiscalUserReviewsActions = () => {
  const queryClient = useQueryClient();

  const createOrUpdateReview = useMutation({
    mutationFn: async ({
      reportId,
      transactionId,
      userId,
      status,
      observation
    }: {
      reportId: string;
      transactionId: string;
      userId: string;
      status: 'approved' | 'divergent';
      observation?: string;
    }) => {
      // Use upsert with the unique constraint
      const { error } = await supabase
        .from('fiscal_user_reviews')
        .upsert({
          report_id: reportId,
          transaction_id: transactionId,
          user_id: userId,
          status,
          observation: observation || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'report_id,transaction_id,user_id'
        });

      if (error) {
        console.error('Error creating/updating fiscal user review:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-user-reviews', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-approval-counts', variables.reportId] });
    },
  });

  const bulkCreateReviews = useMutation({
    mutationFn: async ({
      reportId,
      transactionIds,
      userId,
      status
    }: {
      reportId: string;
      transactionIds: string[];
      userId: string;
      status: 'approved' | 'divergent';
    }) => {
      // Create reviews for all transactions
      const reviews = transactionIds.map(txId => ({
        report_id: reportId,
        transaction_id: txId,
        user_id: userId,
        status,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('fiscal_user_reviews')
        .upsert(reviews, {
          onConflict: 'report_id,transaction_id,user_id'
        });

      if (error) {
        console.error('Error bulk creating fiscal user reviews:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-user-reviews', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-approval-counts', variables.reportId] });
    },
  });

  return {
    createOrUpdateReview,
    bulkCreateReviews,
  };
};
