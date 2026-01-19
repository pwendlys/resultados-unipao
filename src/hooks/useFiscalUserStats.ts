import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalUserStats {
  totalReports: number;
  pendingActions: number;
  completedReports: number;
  totalDiligences: number;
}

export interface ReportUserStatus {
  reportId: string;
  hasSigned: boolean;
  hasPendingReviews: boolean;
  hasPendingDiligenceAck: boolean;
  userStatus: 'pending' | 'completed' | 'waiting_others';
  reportStatus: string;
}

export const useFiscalUserStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['fiscal-user-stats', userId],
    queryFn: async (): Promise<{ stats: FiscalUserStats; reportStatuses: ReportUserStatus[] } | null> => {
      if (!userId) return null;

      // 1. Fetch all fiscal reports
      const { data: reports, error: reportsError } = await supabase
        .from('fiscal_reports')
        .select('id, status, total_entries')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      if (!reports || reports.length === 0) {
        return {
          stats: { totalReports: 0, pendingActions: 0, completedReports: 0, totalDiligences: 0 },
          reportStatuses: []
        };
      }

      const reportIds = reports.map(r => r.id);

      // 2. Fetch user's signatures
      const { data: signatures, error: sigError } = await supabase
        .from('fiscal_report_signatures')
        .select('report_id')
        .eq('user_id', userId)
        .in('report_id', reportIds);

      if (sigError) throw sigError;

      const signedReportIds = new Set((signatures || []).map(s => s.report_id));

      // 3. Fetch transaction orders for all reports
      const { data: transactionOrders, error: toError } = await supabase
        .from('fiscal_report_transaction_order')
        .select('report_id, transaction_id')
        .in('report_id', reportIds);

      if (toError) throw toError;

      // 4. Fetch user's reviews
      const { data: userReviews, error: urError } = await supabase
        .from('fiscal_user_reviews')
        .select('report_id, transaction_id, status, diligence_ack')
        .eq('user_id', userId)
        .in('report_id', reportIds);

      if (urError) throw urError;

      // Create lookup for user reviews
      const userReviewMap = new Map<string, { status: string; diligence_ack: boolean }>();
      (userReviews || []).forEach(r => {
        userReviewMap.set(`${r.report_id}:${r.transaction_id}`, {
          status: r.status,
          diligence_ack: r.diligence_ack
        });
      });

      // 5. Count diligences (divergent transactions in reports user participated)
      const { data: allDiligences, error: dilError } = await supabase
        .from('fiscal_user_reviews')
        .select('report_id, transaction_id')
        .eq('status', 'divergent')
        .in('report_id', reportIds);

      if (dilError) throw dilError;

      // Get unique diligences
      const uniqueDiligences = new Set<string>();
      (allDiligences || []).forEach(d => {
        uniqueDiligences.add(`${d.report_id}:${d.transaction_id}`);
      });

      // 6. Calculate stats per report
      let totalPendingActions = 0;
      let completedReports = 0;
      const reportStatuses: ReportUserStatus[] = [];

      // Group transactions by report
      const transactionsByReport = new Map<string, string[]>();
      (transactionOrders || []).forEach(to => {
        const existing = transactionsByReport.get(to.report_id) || [];
        existing.push(to.transaction_id);
        transactionsByReport.set(to.report_id, existing);
      });

      for (const report of reports) {
        const reportTransactions = transactionsByReport.get(report.id) || [];
        const hasSigned = signedReportIds.has(report.id);
        
        let pendingReviews = 0;
        let pendingDiligenceAck = 0;

        for (const txId of reportTransactions) {
          const review = userReviewMap.get(`${report.id}:${txId}`);
          
          if (!review) {
            // User hasn't reviewed this transaction yet
            pendingReviews++;
          } else if (review.status === 'divergent' && !review.diligence_ack) {
            // Diligence exists but user hasn't acknowledged
            pendingDiligenceAck++;
          }
        }

        const hasPendingReviews = pendingReviews > 0;
        const hasPendingDiligenceAck = pendingDiligenceAck > 0;
        const needsSignature = !hasSigned && report.status === 'open';

        // Calculate pending actions for this report
        const reportPending = pendingReviews + pendingDiligenceAck + (needsSignature ? 1 : 0);
        totalPendingActions += reportPending;

        // Determine user status for this report
        let userStatus: 'pending' | 'completed' | 'waiting_others';
        
        if (hasPendingReviews || hasPendingDiligenceAck || needsSignature) {
          userStatus = 'pending';
        } else if (hasSigned && report.status !== 'finished') {
          userStatus = 'waiting_others';
        } else if (hasSigned) {
          userStatus = 'completed';
          completedReports++;
        } else {
          // User completed reviews but hasn't signed yet (might be waiting for conditions)
          userStatus = 'pending';
        }

        reportStatuses.push({
          reportId: report.id,
          hasSigned,
          hasPendingReviews,
          hasPendingDiligenceAck,
          userStatus,
          reportStatus: report.status
        });
      }

      return {
        stats: {
          totalReports: reports.length,
          pendingActions: totalPendingActions,
          completedReports,
          totalDiligences: uniqueDiligences.size
        },
        reportStatuses
      };
    },
    enabled: !!userId,
    staleTime: 30000,
  });
};
