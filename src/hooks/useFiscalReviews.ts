import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalReview {
  id: string;
  fiscal_report_id: string;
  transaction_id: string;
  entry_index: number;
  status: 'pending' | 'approved' | 'flagged';
  observation: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  transaction?: {
    id: string;
    date: string;
    description: string;
    description_raw: string | null;
    amount: number;
    type: string;
    category: string | null;
    entry_index: number | null;
  } | null;
}

export const useFiscalReviews = (fiscalReportId: string | undefined) => {
  return useQuery({
    queryKey: ['fiscal-reviews', fiscalReportId],
    queryFn: async () => {
      if (!fiscalReportId) return [];
      
      console.log('Fetching fiscal reviews for report:', fiscalReportId);
      
      const { data, error } = await supabase
        .from('fiscal_reviews')
        .select(`
          *,
          transaction:transactions (
            id,
            date,
            description,
            description_raw,
            amount,
            type,
            category,
            entry_index
          )
        `)
        .eq('fiscal_report_id', fiscalReportId)
        .order('entry_index', { ascending: true });

      if (error) {
        console.error('Error fetching fiscal reviews:', error);
        throw error;
      }

      console.log('Fiscal reviews fetched:', data?.length);
      return data as FiscalReview[];
    },
    enabled: !!fiscalReportId,
  });
};

export const useFiscalReviewsActions = () => {
  const queryClient = useQueryClient();

  const createFiscalReviews = useMutation({
    mutationFn: async (data: {
      fiscal_report_id: string;
      transactions: Array<{
        id: string;
        entry_index: number;
      }>;
    }) => {
      const reviews = data.transactions.map(t => ({
        fiscal_report_id: data.fiscal_report_id,
        transaction_id: t.id,
        entry_index: t.entry_index,
        status: 'pending' as const
      }));

      const { error } = await supabase
        .from('fiscal_reviews')
        .insert(reviews);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-reports'] });
    },
  });

  const updateReviewStatus = useMutation({
    mutationFn: async ({
      reviewId,
      status,
      observation,
      reviewedBy
    }: {
      reviewId: string;
      status: 'pending' | 'approved' | 'flagged';
      observation?: string;
      reviewedBy: string;
    }) => {
      const updateData: any = {
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      };

      if (observation !== undefined) {
        updateData.observation = observation;
      }

      const { error } = await supabase
        .from('fiscal_reviews')
        .update(updateData)
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-reports'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-report'] });
    },
  });

  const bulkUpdateReviewStatus = useMutation({
    mutationFn: async ({
      reviewIds,
      status,
      reviewedBy
    }: {
      reviewIds: string[];
      status: 'pending' | 'approved' | 'flagged';
      reviewedBy: string;
    }) => {
      const { error } = await supabase
        .from('fiscal_reviews')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        })
        .in('id', reviewIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-reports'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-report'] });
    },
  });

  return {
    createFiscalReviews,
    updateReviewStatus,
    bulkUpdateReviewStatus,
  };
};
