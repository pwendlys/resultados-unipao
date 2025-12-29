import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Search,
  Filter,
  Download
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import FiscalReviewItem from './FiscalReviewItem';
import FiscalObservationModal from './FiscalObservationModal';
import { generateFiscalPDF } from '@/utils/fiscalPdfGenerator';

interface FiscalReviewPanelProps {
  reportId: string;
  onNavigateToPage?: (page: string) => void;
}

const FiscalReviewPanel = ({ reportId, onNavigateToPage }: FiscalReviewPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: report, isLoading: reportLoading } = useFiscalReportById(reportId);
  const { data: reviews = [], isLoading: reviewsLoading } = useFiscalReviews(reportId);
  const { updateReviewStatus, bulkUpdateReviewStatus } = useFiscalReviewsActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [observationModal, setObservationModal] = useState<{
    open: boolean;
    review: FiscalReview | null;
  }>({ open: false, review: null });

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' || 
      review.transaction?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.transaction?.description_raw?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(review.transaction?.amount).includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.status === 'approved').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
    pending: reviews.filter(r => r.status === 'pending').length,
  };

  const progressPercentage = stats.total > 0 
    ? Math.round((stats.approved + stats.flagged) / stats.total * 100) 
    : 0;

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
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar em lote.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    if (!report) return;
    generateFiscalPDF(report, reviews);
    toast({
      title: "PDF Gerado",
      description: "O relatório foi exportado com sucesso.",
    });
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
      </div>

      {/* Summary Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso da Revisão</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-3" />
          
          <div className="flex justify-center gap-6">
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
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleApproveAllPending}
          disabled={stats.pending === 0}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Aprovar Todos Pendentes ({stats.pending})
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
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
          <SelectTrigger className="w-full md:w-48">
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
      </div>

      {/* Reviews List */}
      <div className="space-y-2">
        {filteredReviews.length === 0 ? (
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
          filteredReviews.map((review) => (
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
    </div>
  );
};

export default FiscalReviewPanel;
