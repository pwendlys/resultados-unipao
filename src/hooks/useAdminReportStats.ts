import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminReportStats {
  totalTransactions: number;
  approvedTransactions: number;   // Transactions reviewed by 3 fiscals
  pendingTransactions: number;
  diligenceCount: number;         // Transactions with at least one divergent review
  confirmedDiligences: number;    // Diligences with 3/3 ack
  signatureCount: number;
  allDiligencesConfirmed: boolean;
  isFinished: boolean;
}

// Hook to calculate aggregated stats for a report from the CORRECT source tables
export const useAdminReportStats = (reportId: string | undefined, totalEntries: number = 0) => {
  return useQuery({
    queryKey: ['admin-report-stats', reportId],
    queryFn: async (): Promise<AdminReportStats> => {
      if (!reportId) {
        return {
          totalTransactions: 0,
          approvedTransactions: 0,
          pendingTransactions: 0,
          diligenceCount: 0,
          confirmedDiligences: 0,
          signatureCount: 0,
          allDiligencesConfirmed: true,
          isFinished: false,
        };
      }

      // 1. Fetch all fiscal_user_reviews for this report (the CORRECT table)
      const { data: reviews, error: reviewsError } = await supabase
        .from('fiscal_user_reviews')
        .select('transaction_id, user_id, status, diligence_ack')
        .eq('report_id', reportId);

      if (reviewsError) {
        console.error('Error fetching fiscal_user_reviews:', reviewsError);
        throw reviewsError;
      }

      // 2. Fetch signature count
      const { data: signatures, error: sigError } = await supabase
        .from('fiscal_report_signatures')
        .select('id')
        .eq('report_id', reportId);

      if (sigError) {
        console.error('Error fetching signatures:', sigError);
        throw sigError;
      }

      // 3. Aggregate by transaction_id
      const txMap: Record<string, {
        reviewers: Set<string>;
        hasDivergent: boolean;
        ackCount: number;
      }> = {};

      for (const review of reviews || []) {
        if (!txMap[review.transaction_id]) {
          txMap[review.transaction_id] = {
            reviewers: new Set(),
            hasDivergent: false,
            ackCount: 0,
          };
        }
        
        txMap[review.transaction_id].reviewers.add(review.user_id);
        
        if (review.status === 'divergent') {
          txMap[review.transaction_id].hasDivergent = true;
        }
        
        if (review.diligence_ack) {
          txMap[review.transaction_id].ackCount++;
        }
      }

      // 4. Calculate stats
      let approvedTransactions = 0;
      let diligenceCount = 0;
      let confirmedDiligences = 0;

      for (const tx of Object.values(txMap)) {
        // A transaction is "reviewed/approved" if at least 3 fiscals reviewed it
        if (tx.reviewers.size >= 3) {
          approvedTransactions++;
        }
        
        // Count diligences
        if (tx.hasDivergent) {
          diligenceCount++;
          if (tx.ackCount >= 3) {
            confirmedDiligences++;
          }
        }
      }

      const signatureCount = signatures?.length || 0;
      const pendingTransactions = Math.max(0, totalEntries - approvedTransactions);
      const allDiligencesConfirmed = diligenceCount === 0 || diligenceCount === confirmedDiligences;
      const isFinished = pendingTransactions === 0 && signatureCount >= 3 && allDiligencesConfirmed;

      return {
        totalTransactions: totalEntries,
        approvedTransactions,
        pendingTransactions,
        diligenceCount,
        confirmedDiligences,
        signatureCount,
        allDiligencesConfirmed,
        isFinished,
      };
    },
    enabled: !!reportId,
  });
};
