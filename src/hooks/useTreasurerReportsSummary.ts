import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface TreasurerReportSummary {
  reportId: string;
  totalTransactions: number;
  approvedTransactions: number;
  pendingTransactions: number;
  diligenceCount: number;
  confirmedDiligences: number;
  allDiligencesConfirmed: boolean;
  signatureCount: number;
  isFinished: boolean;
  hasFinalPdf: boolean;
}

export const useTreasurerReportsSummary = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['treasurer-reports-summary'],
    queryFn: async (): Promise<TreasurerReportSummary[]> => {
      console.log('[Treasurer] Fetching reports summary...');
      
      // Fetch all reports
      const { data: reports, error: reportsError } = await supabase
        .from('fiscal_reports')
        .select('id, total_entries, status, pdf_url');

      if (reportsError) {
        console.error('[Treasurer] Error fetching reports:', reportsError);
        throw reportsError;
      }
      console.log('[Treasurer] Reports fetched:', reports?.length, reports);
      
      if (!reports || reports.length === 0) return [];

      // Fetch all user reviews
      const { data: allReviews, error: reviewsError } = await supabase
        .from('fiscal_user_reviews')
        .select('report_id, transaction_id, user_id, status, observation, diligence_ack, diligence_created_by');

      if (reviewsError) {
        console.error('[Treasurer] Error fetching reviews:', reviewsError);
        throw reviewsError;
      }
      console.log('[Treasurer] Reviews fetched:', allReviews?.length, allReviews);

      // Fetch all signatures
      const { data: allSignatures, error: signaturesError } = await supabase
        .from('fiscal_report_signatures')
        .select('report_id, user_id');

      if (signaturesError) {
        console.error('[Treasurer] Error fetching signatures:', signaturesError);
        throw signaturesError;
      }
      console.log('[Treasurer] Signatures fetched:', allSignatures?.length, allSignatures);

      // Build summaries for each report
      const summaries: TreasurerReportSummary[] = reports.map((report) => {
        const reportReviews = (allReviews || []).filter(r => r.report_id === report.id);
        const reportSignatures = (allSignatures || []).filter(s => s.report_id === report.id);
        const totalTransactions = report.total_entries || 0;

        // Group reviews by transaction
        const txMap: Record<string, {
          reviewers: Set<string>;
          isDiligence: boolean;
          ackCount: number;
        }> = {};

        for (const review of reportReviews) {
          if (!txMap[review.transaction_id]) {
            txMap[review.transaction_id] = {
              reviewers: new Set(),
              isDiligence: false,
              ackCount: 0,
            };
          }
          txMap[review.transaction_id].reviewers.add(review.user_id);
          
          // Check if this transaction has a diligence (divergent status)
          if (review.status === 'divergent' || review.diligence_created_by) {
            txMap[review.transaction_id].isDiligence = true;
          }
          
          // Count acknowledgments
          if (review.diligence_ack) {
            txMap[review.transaction_id].ackCount++;
          }
        }

        let approvedTransactions = 0;
        let diligenceCount = 0;
        let confirmedDiligences = 0;

        for (const tx of Object.values(txMap)) {
          // Transaction is approved if it has 3 distinct reviewers
          if (tx.reviewers.size >= 3) {
            approvedTransactions++;
          }
          
          // Count diligences
          if (tx.isDiligence) {
            diligenceCount++;
            if (tx.ackCount >= 3) {
              confirmedDiligences++;
            }
          }
        }

        const pendingTransactions = totalTransactions - approvedTransactions;
        const signatureCount = new Set(reportSignatures.map(s => s.user_id)).size;
        const allDiligencesConfirmed = diligenceCount === 0 || diligenceCount === confirmedDiligences;
        
        // A report is finished when: 0 pending + 3/3 signatures + all diligences confirmed
        const isFinished = report.status === 'finished' || (
          pendingTransactions === 0 &&
          signatureCount >= 3 &&
          allDiligencesConfirmed
        );

        const summary = {
          reportId: report.id,
          totalTransactions,
          approvedTransactions,
          pendingTransactions,
          diligenceCount,
          confirmedDiligences,
          allDiligencesConfirmed,
          signatureCount,
          isFinished,
          hasFinalPdf: !!report.pdf_url,
        };
        
        console.log(`[Treasurer] Report ${report.id} summary:`, summary);
        return summary;
      });

      console.log('[Treasurer] Final summaries:', summaries);
      return summaries;
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds as fallback
  });

  // Set up realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('treasurer-reports-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fiscal_user_reviews' },
        (payload) => {
          console.log('[Treasurer Realtime] fiscal_user_reviews changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['treasurer-reports-summary'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fiscal_report_signatures' },
        (payload) => {
          console.log('[Treasurer Realtime] fiscal_report_signatures changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['treasurer-reports-summary'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fiscal_reports' },
        (payload) => {
          console.log('[Treasurer Realtime] fiscal_reports changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['treasurer-reports-summary'] });
        }
      )
      .subscribe((status) => {
        console.log('[Treasurer Realtime] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
