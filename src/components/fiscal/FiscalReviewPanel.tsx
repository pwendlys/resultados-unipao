import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  ArrowUpDown,
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Search,
  Filter,
  Download,
  PenTool,
  FileText,
  ListOrdered,
  AlertCircle
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFiscalReportById } from '@/hooks/useFiscalReports';
import { useFiscalReviews, FiscalReview } from '@/hooks/useFiscalReviews';
import { useFiscalSignatures, useFiscalSignaturesActions } from '@/hooks/useFiscalSignatures';
import { useFiscalUserProfile, useSaveDefaultSignature } from '@/hooks/useFiscalUserProfile';
import { useFiscalReportFile, useGetFileUrl } from '@/hooks/useFiscalReportFiles';
import { useFiscalTransactionOrder } from '@/hooks/useFiscalTransactionOrder';
import { 
  useFiscalUserReviews, 
  useTransactionApprovalCounts, 
  useFiscalUserReviewsActions,
  useTransactionDiligenceStatus 
} from '@/hooks/useFiscalUserReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import FiscalReviewItem from './FiscalReviewItem';
import FiscalObservationModal from './FiscalObservationModal';
import FiscalSignatureModal from './FiscalSignatureModal';
import { generateFiscalPDF } from '@/utils/fiscalPdfGenerator';
import { supabase } from '@/integrations/supabase/client';

interface FiscalReviewPanelProps {
  reportId: string;
  onNavigateToPage?: (page: string) => void;
}

const FiscalReviewPanel = ({ reportId, onNavigateToPage }: FiscalReviewPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: report, isLoading: reportLoading, refetch: refetchReport } = useFiscalReportById(reportId);
  const { data: reviews = [], isLoading: reviewsLoading } = useFiscalReviews(reportId);
  const { data: signatures = [], refetch: refetchSignatures } = useFiscalSignatures(reportId);
  const { data: attachedFile } = useFiscalReportFile(reportId);
  const { data: customOrder = [] } = useFiscalTransactionOrder(reportId);
  const getFileUrl = useGetFileUrl();
  const { createSignature } = useFiscalSignaturesActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'entry_index' | 'status_date' | 'amount'>('entry_index');
  const [observationModal, setObservationModal] = useState<{
    open: boolean;
    review: FiscalReview | null;
  }>({ open: false, review: null });
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // Get auth user id for signatures
  useEffect(() => {
    const getAuthUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setAuthUserId(authUser?.id || null);
    };
    getAuthUser();
  }, []);

  // Fetch user profile for saved signature
  const { data: userProfile } = useFiscalUserProfile(authUserId);
  const saveDefaultSignature = useSaveDefaultSignature();

  // Fetch per-fiscal reviews
  const { data: myReviews = [] } = useFiscalUserReviews(reportId, authUserId || undefined);
  const { data: approvalCounts = {} } = useTransactionApprovalCounts(reportId);
  const { data: diligenceStatus = {} } = useTransactionDiligenceStatus(reportId);
  const { createOrUpdateReview, bulkCreateReviews, confirmDiligence } = useFiscalUserReviewsActions();

  // Build a map of my reviews by transaction_id for quick lookup
  const myReviewsMap = useMemo(() => {
    const map: Record<string, { status: 'approved' | 'divergent'; observation?: string; diligence_ack: boolean }> = {};
    for (const r of myReviews) {
      map[r.transaction_id] = { 
        status: r.status, 
        observation: r.observation || undefined,
        diligence_ack: r.diligence_ack 
      };
    }
    return map;
  }, [myReviews]);

  // Check if current user has signed
  const hasUserSigned = authUserId ? signatures.some(sig => sig.user_id === authUserId) : false;
  const signatureCount = signatures.length;
  const hasCustomOrder = customOrder.length > 0;

  // Build order map from custom order (PDF-based)
  const orderMap = useMemo(() => {
    if (!customOrder || customOrder.length === 0) return null;
    return new Map(customOrder.map(o => [o.transaction_id, o.sort_index]));
  }, [customOrder]);

  // Sort reviews based on selected sort order
  const sortReviews = (reviewsToSort: FiscalReview[]) => {
    return [...reviewsToSort].sort((a, b) => {
      switch (sortOrder) {
        case 'entry_index':
          // If we have custom order from PDF, use it
          if (orderMap) {
            const indexA = orderMap.get(a.transaction_id) ?? 9999;
            const indexB = orderMap.get(b.transaction_id) ?? 9999;
            return indexA - indexB;
          }
          // Fallback to original entry_index
          return (a.entry_index || 0) - (b.entry_index || 0);
        
        case 'amount':
          // By amount (highest first)
          const amountA = Math.abs(a.transaction?.amount || 0);
          const amountB = Math.abs(b.transaction?.amount || 0);
          return amountB - amountA;
        
        case 'status_date':
        default:
          // Status priority: pending > flagged > approved, then by date DESC
          const statusPriority: Record<string, number> = { pending: 0, flagged: 1, approved: 2 };
          const statusDiff = (statusPriority[a.status] || 0) - (statusPriority[b.status] || 0);
          if (statusDiff !== 0) return statusDiff;
          
          const parseDate = (d: string) => {
            if (!d) return 0;
            const parts = d.split('/');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              return new Date(`${year}-${month}-${day}`).getTime();
            }
            return new Date(d).getTime();
          };
          
          return parseDate(b.transaction?.date || '') - parseDate(a.transaction?.date || '');
      }
    });
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' || 
      review.transaction?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.transaction?.description_raw?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(review.transaction?.amount).includes(searchTerm);

    // Filter by my status (from fiscal_user_reviews), not global status
    const myReview = myReviewsMap[review.transaction_id];
    const txDiligence = diligenceStatus[review.transaction_id];
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // Pending = not reviewed OR diligence needing confirmation
        const needsDiligenceAck = txDiligence?.isDiligence && !myReview?.diligence_ack;
        matchesStatus = myReview === undefined || needsDiligenceAck;
      } else if (statusFilter === 'approved') {
        matchesStatus = myReview?.status === 'approved' && !txDiligence?.isDiligence;
      } else if (statusFilter === 'flagged') {
        matchesStatus = txDiligence?.isDiligence === true;
      }
    }

    return matchesSearch && matchesStatus;
  });

  // Apply sorting to filtered reviews
  const sortedFilteredReviews = sortReviews(filteredReviews);

  // Stats calculated from the current fiscal user's perspective
  const myApprovedCount = myReviews.filter(r => r.status === 'approved').length;
  const myDivergentCount = myReviews.filter(r => r.status === 'divergent').length;
  
  // Count transactions in diligence
  const diligenceTransactions = Object.entries(diligenceStatus).filter(([_, d]) => d.isDiligence);
  const diligenceCount = diligenceTransactions.length;
  
  // Count pending actions: not reviewed OR diligence not acknowledged
  const myPendingCount = reviews.filter(r => {
    const myReview = myReviewsMap[r.transaction_id];
    const txDiligence = diligenceStatus[r.transaction_id];
    
    // Pending if: no review OR (is diligence and not acknowledged)
    if (!myReview) return true;
    if (txDiligence?.isDiligence && !myReview.diligence_ack) return true;
    return false;
  }).length;

  const stats = {
    total: reviews.length,
    approved: myApprovedCount,
    flagged: myDivergentCount,
    pending: myPendingCount,
    diligences: diligenceCount,
  };

  const progressPercentage = stats.total > 0 
    ? Math.round((stats.total - stats.pending) / stats.total * 100) 
    : 0;

  // Check if all diligences are confirmed (3/3)
  const allDiligencesConfirmed = diligenceTransactions.every(([_, d]) => d.ackCount >= 3);

  // Check if eligible for signing
  // User must have reviewed all AND all diligences must be 3/3 confirmed
  const canSign = stats.pending === 0 && allDiligencesConfirmed && !hasUserSigned;
  const isFinished = report?.status === 'finished' || (stats.pending === 0 && allDiligencesConfirmed && signatureCount >= 3);

  const handleApprove = async (review: FiscalReview) => {
    if (!authUserId) return;
    
    try {
      await createOrUpdateReview.mutateAsync({
        reportId,
        transactionId: review.transaction_id,
        userId: authUserId,
        status: 'approved',
      });
      toast({
        title: "Aprovado",
        description: "Lançamento aprovado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar lançamento.",
        variant: "destructive",
      });
    }
  };

  const handleFlag = (review: FiscalReview) => {
    setObservationModal({ open: true, review });
  };

  const handleSubmitObservation = async (observation: string) => {
    if (!observationModal.review || !authUserId) return;

    try {
      await createOrUpdateReview.mutateAsync({
        reportId,
        transactionId: observationModal.review.transaction_id,
        userId: authUserId,
        status: 'divergent',
        observation,
      });
      toast({
        title: "Diligência Criada",
        description: "Transação marcada como divergente. Todos os fiscais precisam confirmar ciência.",
      });
      setObservationModal({ open: false, review: null });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar divergência.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDiligence = async (transactionId: string) => {
    if (!authUserId) return;

    try {
      await confirmDiligence.mutateAsync({
        reportId,
        transactionId,
        userId: authUserId,
      });
      toast({
        title: "Diligência Confirmada",
        description: "Você confirmou ciência da diligência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar diligência.",
        variant: "destructive",
      });
    }
  };

  const handleApproveAllPending = async () => {
    if (!authUserId) return;
    
    // Get transactions that the current user hasn't reviewed yet (excluding diligences)
    const unreviewedTransactionIds = reviews
      .filter(r => {
        const myReview = myReviewsMap[r.transaction_id];
        const txDiligence = diligenceStatus[r.transaction_id];
        // Only include if not reviewed AND not in diligence
        return !myReview && !txDiligence?.isDiligence;
      })
      .map(r => r.transaction_id);
    
    if (unreviewedTransactionIds.length === 0) {
      toast({
        title: "Nenhum pendente",
        description: "Não há lançamentos pendentes para aprovar em lote (excluindo diligências).",
      });
      return;
    }

    try {
      await bulkCreateReviews.mutateAsync({
        reportId,
        transactionIds: unreviewedTransactionIds,
        userId: authUserId,
        status: 'approved',
      });
      toast({
        title: "Aprovados em Lote",
        description: `${unreviewedTransactionIds.length} lançamentos aprovados.`,
      });

      // After approving all, check if we should open signature modal
      if (allDiligencesConfirmed && !hasUserSigned) {
        setTimeout(() => {
          setSignatureModalOpen(true);
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar em lote.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitSignature = async (signatureData: string) => {
    if (!authUserId || !reportId) return;

    try {
      await createSignature.mutateAsync({
        reportId,
        userId: authUserId,
        signatureData,
        displayName: user?.email || undefined,
      });
      
      toast({
        title: "Assinatura registrada",
        description: "Sua assinatura foi salva com sucesso.",
      });
      
      setSignatureModalOpen(false);
      refetchSignatures();
      refetchReport();
    } catch (error: any) {
      toast({
        title: "Erro ao assinar",
        description: error.message || "Não foi possível registrar sua assinatura.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    if (!report) return;
    
    if (!isFinished) {
      toast({
        title: "PDF não disponível",
        description: "O PDF só pode ser exportado quando o relatório estiver concluído (3 assinaturas e todas as diligências confirmadas).",
        variant: "destructive",
      });
      return;
    }
    
    generateFiscalPDF(report, reviews, signatures, diligenceStatus);
    toast({
      title: "PDF Gerado",
      description: "O relatório foi exportado com sucesso.",
    });
  };

  const handleViewStatementPDF = async () => {
    if (!attachedFile?.file_path) return;

    try {
      const signedUrl = await getFileUrl.mutateAsync(attachedFile.file_path);
      window.open(signedUrl, '_blank');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o PDF do extrato.",
        variant: "destructive",
      });
    }
  };

  if (reportLoading || reviewsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Relatório não encontrado.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => onNavigateToPage?.('fiscal-reports')}
        >
          Voltar aos Relatórios
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onNavigateToPage?.('fiscal-reports')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">{report.title}</h1>
          <p className="text-sm text-muted-foreground">
            {report.competencia} • {report.account_type}
          </p>
        </div>
        {isFinished && (
          <Badge className="bg-green-500">Concluído</Badge>
        )}
      </div>

      {/* Summary Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso da Revisão</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-3" />
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{stats.approved}</span>
              <span className="text-muted-foreground text-xs">Aprovados</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{stats.pending}</span>
              <span className="text-xs">Pendentes</span>
            </div>
            {stats.diligences > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{stats.diligences}</span>
                <span className="text-muted-foreground text-xs">Diligências</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <PenTool className="h-4 w-4 text-muted-foreground" />
              <span className={signatureCount >= 3 ? 'text-green-600 font-medium' : 'font-medium'}>
                {signatureCount}/3
              </span>
              <span className="text-muted-foreground text-xs">Assinaturas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {attachedFile && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewStatementPDF}
            disabled={getFileUrl.isPending}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Extrato (PDF)
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleApproveAllPending}
          disabled={stats.pending === 0 || stats.pending === stats.diligences}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Aprovar Todos Pendentes
        </Button>
        
        {canSign && (
          <Button 
            size="sm"
            onClick={() => setSignatureModalOpen(true)}
            className="bg-primary"
          >
            <PenTool className="h-4 w-4 mr-2" />
            Assinar Relatório
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportPDF}
          disabled={!isFinished}
          title={isFinished ? "Exportar PDF" : "Disponível apenas quando concluído"}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição ou valor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="flagged">Diligências</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
          <SelectTrigger className="w-full md:w-56">
            {hasCustomOrder && sortOrder === 'entry_index' ? (
              <ListOrdered className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <ArrowUpDown className="h-4 w-4 mr-2" />
            )}
            <SelectValue placeholder="Ordenação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entry_index">
              {hasCustomOrder ? 'Ordem do PDF ✓' : 'Ordem do Extrato'}
            </SelectItem>
            <SelectItem value="status_date">Status + Data</SelectItem>
            <SelectItem value="amount">Valor (maior primeiro)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-2">
        {sortedFilteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhum lançamento encontrado com os filtros aplicados.'
                  : 'Nenhum lançamento para revisar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedFilteredReviews.map((review) => {
            const myReview = myReviewsMap[review.transaction_id];
            const txDiligence = diligenceStatus[review.transaction_id];
            const approvalCount = approvalCounts[review.transaction_id] || 0;
            
            return (
              <FiscalReviewItem
                key={review.id}
                review={review}
                myStatus={myReview?.status}
                myDiligenceAck={myReview?.diligence_ack || false}
                approvalCount={approvalCount}
                isDiligence={txDiligence?.isDiligence || false}
                diligenceAckCount={txDiligence?.ackCount || 0}
                onApprove={() => handleApprove(review)}
                onFlag={() => handleFlag(review)}
                onConfirmDiligence={() => handleConfirmDiligence(review.transaction_id)}
              />
            );
          })
        )}
      </div>

      {/* Observation Modal */}
      <FiscalObservationModal
        open={observationModal.open}
        onOpenChange={(open) => setObservationModal({ open, review: open ? observationModal.review : null })}
        onSubmit={handleSubmitObservation}
        transaction={observationModal.review?.transaction || null}
      />

      {/* Signature Modal */}
      <FiscalSignatureModal
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        onSubmit={handleSubmitSignature}
        isSubmitting={createSignature.isPending}
        hasAlreadySigned={hasUserSigned}
        savedSignature={userProfile?.default_signature_data}
        onSaveAsDefault={(signatureData) => {
          if (authUserId) {
            saveDefaultSignature.mutate(
              { userId: authUserId, signatureData },
              {
                onSuccess: () => {
                  toast({
                    title: "Assinatura salva",
                    description: "Sua assinatura foi salva como padrão.",
                  });
                },
                onError: () => {
                  toast({
                    title: "Erro",
                    description: "Não foi possível salvar a assinatura padrão.",
                    variant: "destructive",
                  });
                },
              }
            );
          }
        }}
      />
    </div>
  );
};

export default FiscalReviewPanel;
