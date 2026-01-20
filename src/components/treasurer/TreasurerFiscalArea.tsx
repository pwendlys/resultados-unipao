import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Shield, 
  Eye, 
  Download, 
  FileText,
  AlertCircle,
  PenTool,
  FileCheck,
  Loader2,
  Trash2,
  Calendar
} from 'lucide-react';
import { useAllFiscalReports, useFiscalReportsActions } from '@/hooks/useFiscalReports';
import { useTreasurerReportsSummary, TreasurerReportSummary } from '@/hooks/useTreasurerReportsSummary';
import { useFiscalReviews } from '@/hooks/useFiscalReviews';
import { useFiscalSignatures } from '@/hooks/useFiscalSignatures';
import { useTransactionDiligenceStatus } from '@/hooks/useFiscalUserReviews';
import { useToast } from '@/hooks/use-toast';
import { generateFiscalPDF, generateFiscalPDFBlob } from '@/utils/fiscalPdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import FiscalSignaturesModal from '@/components/fiscal/FiscalSignaturesModal';
import FiscalDiligencesModal from '@/components/fiscal/FiscalDiligencesModal';
import { cn } from '@/lib/utils';

interface TreasurerFiscalAreaProps {
  onNavigateToPage?: (page: string) => void;
}

const TreasurerFiscalArea = ({ onNavigateToPage }: TreasurerFiscalAreaProps) => {
  const { toast } = useToast();
  const { data: reports = [], isLoading } = useAllFiscalReports();
  const { data: summaries = [] } = useTreasurerReportsSummary();
  const { deleteFiscalReport } = useFiscalReportsActions();

  const [signaturesModal, setSignaturesModal] = useState<{
    open: boolean;
    reportId: string;
    reportTitle: string;
  }>({ open: false, reportId: '', reportTitle: '' });

  const [diligencesModal, setDiligencesModal] = useState<{
    open: boolean;
    reportId: string;
    reportTitle: string;
  }>({ open: false, reportId: '', reportTitle: '' });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    reportId: string | null;
    reportTitle: string;
  }>({ open: false, reportId: null, reportTitle: '' });

  const handleDeleteReport = async () => {
    if (!deleteDialog.reportId) return;
    
    try {
      await deleteFiscalReport.mutateAsync(deleteDialog.reportId);
      toast({
        title: "Relatório excluído",
        description: "O relatório fiscal foi removido com sucesso.",
      });
      setDeleteDialog({ open: false, reportId: null, reportTitle: '' });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (summary: TreasurerReportSummary | undefined, reportStatus: string) => {
    if (summary?.isFinished || reportStatus === 'finished') {
      return <Badge className="bg-green-500">Concluído</Badge>;
    }
    if (summary && summary.pendingTransactions === 0 && summary.signatureCount >= 3 && summary.allDiligencesConfirmed) {
      return <Badge className="bg-amber-500">Pronto para Final</Badge>;
    }
    return <Badge variant="outline">Em Andamento</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold">Área Fiscal - Gerar Relatório Final</h1>
          <p className="text-muted-foreground">
            Visualize o progresso e gere o PDF final dos relatórios concluídos
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum relatório fiscal foi criado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Relatórios Fiscais ({reports.length})
          </h2>
          
          <div className="grid gap-4">
            {reports.map((report) => {
              const summary = summaries.find(s => s.reportId === report.id);
              return (
                <TreasurerReportCard 
                  key={report.id} 
                  report={report}
                  summary={summary}
                  onViewSignatures={() => setSignaturesModal({
                    open: true,
                    reportId: report.id,
                    reportTitle: report.title,
                  })}
                  onViewDiligences={() => setDiligencesModal({
                    open: true,
                    reportId: report.id,
                    reportTitle: report.title,
                  })}
                  onDelete={() => setDeleteDialog({
                    open: true,
                    reportId: report.id,
                    reportTitle: report.title,
                  })}
                  getStatusBadge={getStatusBadge}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Assinaturas */}
      <FiscalSignaturesModal
        open={signaturesModal.open}
        onOpenChange={(open) => setSignaturesModal({ ...signaturesModal, open })}
        reportId={signaturesModal.reportId}
        reportTitle={signaturesModal.reportTitle}
      />

      {/* Modal de Diligências */}
      <FiscalDiligencesModal
        open={diligencesModal.open}
        onOpenChange={(open) => setDiligencesModal({ ...diligencesModal, open })}
        reportId={diligencesModal.reportId}
        reportTitle={diligencesModal.reportTitle}
      />

      {/* AlertDialog de Exclusão */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório "{deleteDialog.reportTitle}"? 
              Esta ação não pode ser desfeita e removerá todas as revisões e assinaturas associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Componente de Card para cada relatório
interface TreasurerReportCardProps {
  report: any;
  summary: TreasurerReportSummary | undefined;
  onViewSignatures: () => void;
  onViewDiligences: () => void;
  onDelete: () => void;
  getStatusBadge: (summary: TreasurerReportSummary | undefined, status: string) => JSX.Element;
}

const TreasurerReportCard = ({ 
  report, 
  summary,
  onViewSignatures, 
  onViewDiligences, 
  onDelete,
  getStatusBadge 
}: TreasurerReportCardProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // For PDF export, we need reviews and signatures data
  const { data: reviews = [] } = useFiscalReviews(report.id);
  const { data: signatures = [] } = useFiscalSignatures(report.id);
  const { data: diligenceStatus = {} } = useTransactionDiligenceStatus(report.id);

  // Use aggregated stats from summary
  const approvedCount = summary?.approvedTransactions ?? 0;
  const pendingCount = summary?.pendingTransactions ?? report.total_entries ?? 0;
  const diligenceCount = summary?.diligenceCount ?? 0;
  const allDiligencesConfirmed = summary?.allDiligencesConfirmed ?? true;
  const signatureCount = summary?.signatureCount ?? 0;
  const isFinished = summary?.isFinished ?? false;
  const hasFinalPdf = summary?.hasFinalPdf ?? false;
  
  const totalTransactions = report.total_entries || 0;
  const progressPercentage = totalTransactions > 0 
    ? Math.round(approvedCount / totalTransactions * 100) 
    : 0;

  // Can generate final PDF only when: 0 pending + 3/3 signatures + all diligences confirmed
  const canGenerateFinal = pendingCount === 0 && signatureCount >= 3 && allDiligencesConfirmed && !hasFinalPdf;

  const handleGenerateFinalPDF = async () => {
    if (!canGenerateFinal) return;
    
    setIsGenerating(true);
    
    try {
      // Generate PDF blob
      const pdfBlob = await generateFiscalPDFBlob(report, reviews, signatures, diligenceStatus);
      
      // Upload to Storage
      const fileName = `final_${report.competencia.replace('/', '-')}_${Date.now()}.pdf`;
      const filePath = `final-reports/${report.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('fiscal-files')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('fiscal-files')
        .getPublicUrl(filePath);

      // Update report with PDF URL and status
      const { error: updateError } = await supabase
        .from('fiscal_reports')
        .update({
          pdf_url: urlData.publicUrl,
          status: 'finished',
          updated_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      if (updateError) throw updateError;

      toast({
        title: "PDF Final Gerado!",
        description: "O relatório foi concluído e o PDF está disponível para download.",
      });

    } catch (error) {
      console.error('Error generating final PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF final. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (hasFinalPdf && report.pdf_url) {
      window.open(report.pdf_url, '_blank');
    } else if (isFinished) {
      // Generate and download directly if finished but no stored PDF
      generateFiscalPDF(report, reviews, signatures, diligenceStatus);
      toast({
        title: "PDF Gerado",
        description: "O relatório foi exportado com sucesso.",
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      {/* Linha Principal: Título + Status + Data */}
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{report.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {report.competencia} • {report.account_type}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(summary, report.status)}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(report.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Grid de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border">
          {/* Progresso */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Progresso</p>
            <div className="flex flex-col items-center gap-1">
              <Progress value={progressPercentage} className="h-2 w-full max-w-[80px]" />
              <span className="text-sm font-medium">{approvedCount}/{totalTransactions}</span>
            </div>
          </div>
          
          {/* Pendentes */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <span className={cn(
              "text-xl font-bold",
              pendingCount > 0 ? "text-orange-600" : "text-green-600"
            )}>
              {pendingCount}
            </span>
          </div>
          
          {/* Diligências */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Diligências</p>
            {diligenceCount > 0 ? (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-sm",
                  allDiligencesConfirmed ? "text-green-600 border-green-500" : "text-orange-600 border-orange-500"
                )}
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                {diligenceCount} {allDiligencesConfirmed ? '✓' : ''}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          
          {/* Assinaturas */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Assinaturas</p>
            <div className="flex items-center justify-center gap-1">
              <PenTool className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "text-sm font-medium",
                signatureCount >= 3 && "text-green-600"
              )}>
                {signatureCount}/3
              </span>
            </div>
          </div>
        </div>
        
        {/* Ações */}
        <div className="flex flex-wrap justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewDiligences}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Diligências</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewSignatures}
            className="gap-1"
          >
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline">Assinaturas</span>
          </Button>
          
          {/* Generate Final PDF Button */}
          {canGenerateFinal && (
            <Button 
              variant="default"
              size="sm"
              onClick={handleGenerateFinalPDF}
              disabled={isGenerating}
              className="bg-amber-600 hover:bg-amber-700 gap-1"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4" />
              )}
              {isGenerating ? 'Gerando...' : 'Gerar Final'}
            </Button>
          )}
          
          {/* Download PDF Button */}
          {(hasFinalPdf || isFinished) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDownloadPDF}
              className="text-green-600 gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          )}

          {/* Delete Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDelete}
            className="text-destructive hover:text-destructive gap-1"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Excluir</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreasurerFiscalArea;