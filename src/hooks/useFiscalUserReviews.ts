import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalUserReview {
  id: string;
  report_id: string;
  transaction_id: string;
  user_id: string;
  status: 'approved' | 'divergent';
  observation: string | null;
  diligence_ack: boolean;
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

// Hook to get all reviews for a report (for diligence calculation)
export const useAllFiscalUserReviews = (reportId: string | undefined) => {
  return useQuery({
    queryKey: ['all-fiscal-user-reviews', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      
      const { data, error } = await supabase
        .from('fiscal_user_reviews')
        .select('*')
        .eq('report_id', reportId);

      if (error) {
        console.error('Error fetching all fiscal user reviews:', error);
        throw error;
      }

      return data as FiscalUserReview[];
    },
    enabled: !!reportId,
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

export interface TransactionDiligenceInfo {
  isDiligence: boolean;
  ackCount: number;
  divergentObservation?: string;
}

// Hook to get diligence status for all transactions in a report
export const useTransactionDiligenceStatus = (reportId: string | undefined) => {
  return useQuery({
    queryKey: ['transaction-diligence-status', reportId],
    queryFn: async () => {
      if (!reportId) return {};
      
      const { data, error } = await supabase
        .from('fiscal_user_reviews')
        .select('transaction_id, user_id, status, diligence_ack, observation')
        .eq('report_id', reportId);

      if (error) {
        console.error('Error fetching transaction diligence status:', error);
        throw error;
      }

      // Build diligence map
      const diligenceMap: Record<string, TransactionDiligenceInfo> = {};

      for (const review of data || []) {
        if (!diligenceMap[review.transaction_id]) {
          diligenceMap[review.transaction_id] = {
            isDiligence: false,
            ackCount: 0,
          };
        }
        
        // If any fiscal marked as divergent, this transaction is in diligence
        if (review.status === 'divergent') {
          diligenceMap[review.transaction_id].isDiligence = true;
          if (review.observation) {
            diligenceMap[review.transaction_id].divergentObservation = review.observation;
          }
        }
        
        // Count acknowledgments
        if (review.diligence_ack) {
          diligenceMap[review.transaction_id].ackCount++;
        }
      }

      return diligenceMap;
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
          diligence_ack: false, // Reset when status changes
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'report_id,transaction_id,user_id'
        });

      if (error) {
        console.error('Error creating/updating fiscal user review:', error);
        throw error;
      }

      // If marking as divergent, reset all diligence_ack for this transaction
      if (status === 'divergent') {
        const { error: resetError } = await supabase
          .from('fiscal_user_reviews')
          .update({ diligence_ack: false, updated_at: new Date().toISOString() })
          .eq('report_id', reportId)
          .eq('transaction_id', transactionId);

        if (resetError) {
          console.error('Error resetting diligence_ack:', resetError);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-user-reviews', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['all-fiscal-user-reviews', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-approval-counts', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-diligence-status', variables.reportId] });
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
        diligence_ack: false,
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
      queryClient.invalidateQueries({ queryKey: ['all-fiscal-user-reviews', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-approval-counts', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-diligence-status', variables.reportId] });
    },
  });

  const confirmDiligence = useMutation({
    mutationFn: async ({
      reportId,
      transactionId,
      userId,
    }: {
      reportId: string;
      transactionId: string;
      userId: string;
    }) => {
      // Check if user has an existing review for this transaction
      const { data: existing, error: fetchError } = await supabase
        .from('fiscal_user_reviews')
        .select('id')
        .eq('report_id', reportId)
        .eq('transaction_id', transactionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing review:', fetchError);
        throw fetchError;
      }

      if (existing) {
        // Update existing review to mark diligence_ack = true
        const { error } = await supabase
          .from('fiscal_user_reviews')
          .update({ 
            diligence_ack: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error confirming diligence:', error);
          throw error;
        }
      } else {
        // Create new review with status approved and diligence_ack = true
        const { error } = await supabase
          .from('fiscal_user_reviews')
          .insert({
            report_id: reportId,
            transaction_id: transactionId,
            user_id: userId,
            status: 'approved',
            diligence_ack: true,
          });

        if (error) {
          console.error('Error creating review with diligence_ack:', error);
          throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-user-reviews', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['all-fiscal-user-reviews', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-approval-counts', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-diligence-status', variables.reportId] });
    },
  });

  return {
    createOrUpdateReview,
    bulkCreateReviews,
    confirmDiligence,
  };
};
