import { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFiscalReportById } from '@/hooks/useFiscalReports';
import { useFiscalReviews, useFiscalReviewsActions, FiscalReview } from '@/hooks/useFiscalReviews';
import { useFiscalSignatures, useFiscalSignaturesActions } from '@/hooks/useFiscalSignatures';
import { useFiscalUserProfile, useSaveDefaultSignature } from '@/hooks/useFiscalUserProfile';
import { useFiscalReportFile, useGetFileUrl } from '@/hooks/useFiscalReportFiles';
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
  const getFileUrl = useGetFileUrl();
  const { updateReviewStatus, bulkUpdateReviewStatus } = useFiscalReviewsActions();
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

  // Check if current user has signed
  const hasUserSigned = authUserId ? signatures.some(sig => sig.user_id === authUserId) : false;
  const signatureCount = signatures.length;

  // Sort reviews based on selected sort order
  const sortReviews = (reviewsToSort: FiscalReview[]) => {
    return [...reviewsToSort].sort((a, b) => {
      switch (sortOrder) {
        case 'entry_index':
          // Original bank statement order (ascending)
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

    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Apply sorting to filtered reviews
  const sortedFilteredReviews = sortReviews(filteredReviews);

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.status === 'approved').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
    pending: reviews.filter(r => r.status === 'pending').length,
  };

  const progressPercentage = stats.total > 0 
    ? Math.round((stats.approved + stats.flagged) / stats.total * 100) 
    : 0;

  // Check if eligible for signing
  const canSign = stats.pending === 0 && stats.flagged === 0 && !hasUserSigned;
  const isFinished = report?.status === 'finished' || (stats.pending === 0 && stats.flagged === 0 && signatureCount >= 3);

  const handleApprove = async (review: FiscalReview) => {
    try {
      await updateReviewStatus.mutateAsync({
        reviewId: review.id,
        status: 'approved',
        reviewedBy: user?.email || '',
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
    if (!observationModal.review) return;

    try {
      await updateReviewStatus.mutateAsync({
        reviewId: observationModal.review.id,
        status: 'flagged',
        observation,
        reviewedBy: user?.email || '',
      });
      toast({
        title: "Marcado como Divergente",
        description: "Observação registrada com sucesso.",
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

  const handleApproveAllPending = async () => {
    const pendingIds = reviews.filter(r => r.status === 'pending').map(r => r.id);
    if (pendingIds.length === 0) return;

    try {
      await bulkUpdateReviewStatus.mutateAsync({
        reviewIds: pendingIds,
        status: 'approved',
        reviewedBy: user?.email || '',
      });
      toast({
        title: "Aprovados em Lote",
        description: `${pendingIds.length} lançamentos aprovados.`,
      });

      // After approving all, check if we should open signature modal
      const newFlaggedCount = reviews.filter(r => r.status === 'flagged').length;
      if (newFlaggedCount === 0 && !hasUserSigned) {
        // Small delay to let the UI update
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
        description: "O PDF só pode ser exportado quando o relatório estiver concluído (3 assinaturas).",
        variant: "destructive",
      });
      return;
    }
    
    generateFiscalPDF(report, reviews, signatures);
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
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{stats.flagged}</span>
              <span className="text-muted-foreground text-xs">Divergentes</span>
            </div>
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
          disabled={stats.pending === 0}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Aprovar Todos Pendentes ({stats.pending})
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
            <SelectItem value="flagged">Divergentes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
          <SelectTrigger className="w-full md:w-56">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ordenação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entry_index">Ordem do Extrato ✓</SelectItem>
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
          sortedFilteredReviews.map((review) => (
            <FiscalReviewItem
              key={review.id}
              review={review}
              onApprove={() => handleApprove(review)}
              onFlag={() => handleFlag(review)}
            />
          ))
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
