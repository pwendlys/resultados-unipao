import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportListStats {
  signatureCount: number;
  diligenceCount: number;
  noChangeCount: number;
}

export const useReportsListStats = (reportIds: string[]) => {
  return useQuery({
    queryKey: ['reports-list-stats', reportIds],
    queryFn: async () => {
      if (reportIds.length === 0) return {};

      // 1. Buscar contagem de assinaturas por relatório
      const { data: sigData } = await supabase
        .from('fiscal_report_signatures')
        .select('report_id, user_id')
        .in('report_id', reportIds);

      // 2. Buscar reviews para calcular diligências (transações com status='divergent')
      const { data: reviewsData } = await supabase
        .from('fiscal_user_reviews')
        .select('report_id, transaction_id, status')
        .in('report_id', reportIds);

      // Processar dados
      const statsMap: Record<string, ReportListStats> = {};

      // Inicializar todos os relatórios
      for (const reportId of reportIds) {
        statsMap[reportId] = { signatureCount: 0, diligenceCount: 0, noChangeCount: 0 };
      }

      // Contar assinaturas únicas por relatório
      const signaturesByReport: Record<string, Set<string>> = {};
      for (const sig of sigData || []) {
        if (!signaturesByReport[sig.report_id]) {
          signaturesByReport[sig.report_id] = new Set();
        }
        signaturesByReport[sig.report_id].add(sig.user_id);
      }

      for (const reportId of reportIds) {
        statsMap[reportId].signatureCount = signaturesByReport[reportId]?.size || 0;
      }

      // Contar diligências (transações únicas com pelo menos um status='divergent')
      const diligencesByReport: Record<string, Set<string>> = {};
      
      for (const review of reviewsData || []) {
        if (!diligencesByReport[review.report_id]) {
          diligencesByReport[review.report_id] = new Set();
        }
        if (review.status === 'divergent') {
          diligencesByReport[review.report_id].add(review.transaction_id);
        }
      }

      for (const reportId of reportIds) {
        statsMap[reportId].diligenceCount = diligencesByReport[reportId]?.size || 0;
      }

      return statsMap;
    },
    enabled: reportIds.length > 0,
    staleTime: 30000,
  });
};
