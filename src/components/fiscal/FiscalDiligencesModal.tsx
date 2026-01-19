import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Check, Clock, User } from 'lucide-react';
import { useTransactionDiligenceStatus, useAllFiscalUserReviews } from '@/hooks/useFiscalUserReviews';
import { supabase } from '@/integrations/supabase/client';

interface FiscalDiligencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
}

// Hook to get transactions for a report
const useReportTransactions = (reportId: string | undefined, transactionIds: string[]) => {
  return useQuery({
    queryKey: ['report-transactions-for-diligences', reportId, transactionIds.length],
    queryFn: async () => {
      if (!reportId || transactionIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, description, amount, type')
        .in('id', transactionIds);

      if (error) {
        console.error('Error fetching transactions for diligences:', error);
        return {};
      }

      // Map by id for quick lookup
      const map: Record<string, { date: string; description: string; amount: number; type: string }> = {};
      for (const tx of data || []) {
        map[tx.id] = tx;
      }
      return map;
    },
    enabled: !!reportId && transactionIds.length > 0,
  });
};

const FiscalDiligencesModal = ({
  open,
  onOpenChange,
  reportId,
  reportTitle,
}: FiscalDiligencesModalProps) => {
  // Use the CORRECT hook that reads from fiscal_user_reviews
  const { data: diligenceStatus = {} } = useTransactionDiligenceStatus(open ? reportId : undefined);
  
  // Get list of transaction IDs with diligences
  const diligenceTransactionIds = Object.entries(diligenceStatus)
    .filter(([_, d]) => d.isDiligence)
    .map(([txId]) => txId);

  // Fetch transaction details
  const { data: transactionsMap = {} } = useReportTransactions(
    open ? reportId : undefined, 
    diligenceTransactionIds
  );

  // Build diligence entries with transaction data
  const diligenceEntries = Object.entries(diligenceStatus)
    .filter(([_, d]) => d.isDiligence)
    .map(([txId, d]) => {
      const tx = transactionsMap[txId];
      return {
        transactionId: txId,
        date: tx?.date || '-',
        description: tx?.description || 'Carregando...',
        amount: tx?.amount || 0,
        type: tx?.type || 'unknown',
        observation: d.divergentObservation || 'Sem observação',
        createdBy: d.diligenceCreatorName || 'Desconhecido',
        createdAt: d.diligenceCreatedAt,
        ackCount: d.ackCount,
        isConfirmed: d.ackCount >= 3,
      };
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(value));
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Diligências - {reportTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-sm text-muted-foreground">
            Total de diligências registradas
          </span>
          <Badge variant="outline" className="text-orange-600 border-orange-500">
            {diligenceEntries.length}
          </Badge>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {diligenceEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Check className="h-12 w-12 mb-4 text-green-500" />
              <p>Nenhuma diligência registrada.</p>
              <p className="text-sm">Todas as transações foram aprovadas sem alterações.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {diligenceEntries.map((entry, index) => (
                <div
                  key={entry.transactionId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">
                          {entry.date}
                        </span>
                        <Badge
                          variant={entry.type === 'credit' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {entry.type === 'credit' ? 'Crédito' : 'Débito'}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm line-clamp-2">
                        {entry.description}
                      </p>
                      <p className={`text-lg font-bold ${entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'credit' ? '+' : '-'} {formatCurrency(entry.amount)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={entry.isConfirmed 
                        ? 'text-green-600 border-green-500' 
                        : 'text-orange-600 border-orange-500'
                      }
                    >
                      {entry.isConfirmed ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {entry.ackCount}/3
                    </Badge>
                  </div>

                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Motivo da Diligência:</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.observation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Marcado por: {entry.createdBy}</span>
                    {entry.createdAt && (
                      <span>• {formatDate(entry.createdAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FiscalDiligencesModal;
