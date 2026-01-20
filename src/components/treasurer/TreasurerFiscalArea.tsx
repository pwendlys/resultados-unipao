import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useAllFiscalReports, useFiscalReportsActions } from '@/hooks/useFiscalReports';
import { useTreasurerReportsSummary, TreasurerReportSummary } from '@/hooks/useTreasurerReportsSummary';
import { useFiscalReviews } from '@/hooks/useFiscalReviews';
import { useFiscalSignatures } from '@/hooks/useFiscalSignatures';
import { useTransactionDiligenceStatus } from '@/hooks/useFiscalUserReviews';
import { useTreasurerSignature, useTreasurerSignatureActions } from '@/hooks/useTreasurerSignature';
import { useProfilesByIds, useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { generateFiscalPDF, generateFiscalPDFBlob } from '@/utils/fiscalPdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import FiscalSignaturesModal from '@/components/fiscal/FiscalSignaturesModal';
import FiscalDiligencesModal from '@/components/fiscal/FiscalDiligencesModal';
import TreasurerSignatureModal from '@/components/treasurer/TreasurerSignatureModal';
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

  const [treasurerSignModal, setTreasurerSignModal] = useState<{
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
                  onSignAsTreasurer={() => setTreasurerSignModal({
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

      {/* Modal de Assinaturas dos Fiscais */}
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

      {/* Modal de Assinatura do Tesoureiro */}
      <TreasurerSignatureModalWrapper
        open={treasurerSignModal.open}
        onOpenChange={(open) => setTreasurerSignModal({ ...treasurerSignModal, open })}
        reportId={treasurerSignModal.reportId}
        reportTitle={treasurerSignModal.reportTitle}
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

// Wrapper for TreasurerSignatureModal with actions
interface TreasurerSignatureModalWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
}

const TreasurerSignatureModalWrapper = ({
  open,
  onOpenChange,
  reportId,
  reportTitle,
}: TreasurerSignatureModalWrapperProps) => {
  const { createSignature } = useTreasurerSignatureActions();
  const { data: profile } = useProfile();

  const handleSubmit = async (signatureData: string) => {
    await createSignature.mutateAsync({
      reportId,
      signatureData,
      displayName: profile?.full_name || undefined,
    });
    onOpenChange(false);
  };

  return (
    <TreasurerSignatureModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      isSubmitting={createSignature.isPending}
      reportTitle={reportTitle}
    />
  );
};

// Componente de Card para cada relatório
interface TreasurerReportCardProps {
  report: any;
  summary: TreasurerReportSummary | undefined;
  onViewSignatures: () => void;
  onViewDiligences: () => void;
  onSignAsTreasurer: () => void;
  onDelete: () => void;
  getStatusBadge: (summary: TreasurerReportSummary | undefined, status: string) => JSX.Element;
}

const TreasurerReportCard = ({ 
  report, 
  summary,
  onViewSignatures, 
  onViewDiligences,
  onSignAsTreasurer,
  onDelete,
  getStatusBadge 
}: TreasurerReportCardProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // For PDF export, we need reviews and signatures data
  const { data: reviews = [] } = useFiscalReviews(report.id);
  const { data: fiscalSignatures = [] } = useFiscalSignatures(report.id);
  const { data: diligenceStatus = {} } = useTransactionDiligenceStatus(report.id);
  const { data: treasurerSignature } = useTreasurerSignature(report.id);

  // Collect user IDs for profiles (diligence creators + signers)
  const profileUserIds = React.useMemo(() => {
    const ids = new Set<string>();
    
    // Add diligence creators
    Object.values(diligenceStatus).forEach(d => {
      if (d.diligenceCreatedBy) ids.add(d.diligenceCreatedBy);
    });
    
    // Add fiscal signers
    fiscalSignatures.forEach(s => ids.add(s.user_id));
    
    // Add treasurer signer
    if (treasurerSignature?.user_id) ids.add(treasurerSignature.user_id);
    
    return Array.from(ids);
  }, [diligenceStatus, fiscalSignatures, treasurerSignature]);

  const { data: profiles = {} } = useProfilesByIds(profileUserIds);

  // Use aggregated stats from summary
  const approvedCount = summary?.approvedTransactions ?? 0;
  const pendingCount = summary?.pendingTransactions ?? report.total_entries ?? 0;
  const diligenceCount = summary?.diligenceCount ?? 0;
  const allDiligencesConfirmed = summary?.allDiligencesConfirmed ?? true;
  const signatureCount = summary?.signatureCount ?? 0;
  const isFinished = summary?.isFinished ?? false;
  const hasFinalPdf = summary?.hasFinalPdf ?? false;
  const hasTreasurerSigned = !!treasurerSignature;
  
  const totalTransactions = report.total_entries || 0;
  const progressPercentage = totalTransactions > 0 
    ? Math.round(approvedCount / totalTransactions * 100) 
    : 0;

  // Can sign as treasurer when: 0 pending + 3/3 fiscal signatures + all diligences confirmed + not yet signed
  const canSignAsTreasurer = pendingCount === 0 && signatureCount >= 3 && allDiligencesConfirmed && !hasTreasurerSigned;

  // Can generate final PDF only when: 0 pending + 3/3 fiscal + all diligences + treasurer signed + no PDF yet
  const canGenerateFinal = pendingCount === 0 && signatureCount >= 3 && allDiligencesConfirmed && hasTreasurerSigned && !hasFinalPdf;

  // Tooltip message for disabled generate button
  const getGenerateTooltip = (): string | null => {
    if (hasFinalPdf) return null;
    if (pendingCount > 0) return `Ainda há ${pendingCount} transação(ões) pendente(s)`;
    if (signatureCount < 3) return `Faltam ${3 - signatureCount} assinatura(s) dos fiscais`;
    if (!allDiligencesConfirmed) return 'Há diligências não confirmadas';
    if (!hasTreasurerSigned) return 'Assine como Tesoureiro para liberar a geração';
    return null;
  };

  const handleGenerateFinalPDF = async () => {
    if (!canGenerateFinal) return;
    
    setIsGenerating(true);
    console.log('[PDF] Starting generation for report:', report.id);
    
    try {
      // Validate data before generating
      console.log('[PDF] Reviews count:', reviews.length);
      console.log('[PDF] Fiscal signatures count:', fiscalSignatures.length);
      console.log('[PDF] Diligence status entries:', Object.keys(diligenceStatus).length);
      console.log('[PDF] Treasurer signature:', !!treasurerSignature);

      if (reviews.length === 0) {
        throw new Error('Nenhuma transação encontrada para o relatório');
      }
      if (fiscalSignatures.length < 3) {
        throw new Error(`Assinaturas fiscais insuficientes: ${fiscalSignatures.length}/3`);
      }
      if (!treasurerSignature) {
        throw new Error('Assinatura do tesoureiro não encontrada');
      }

      // Generate PDF blob with treasurer signature and profiles
      const pdfBlob = await generateFiscalPDFBlob(report, reviews, fiscalSignatures, diligenceStatus, treasurerSignature, profiles);
      console.log('[PDF] Blob generated, size:', pdfBlob.size);
      
      // Upload to Storage
      const fileName = `final_${report.competencia.replace('/', '-')}_${Date.now()}.pdf`;
      const filePath = `final-reports/${report.id}/${fileName}`;
      
      console.log('[PDF] Uploading to storage:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('fiscal-files')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('[PDF] Upload error:', uploadError);
        throw new Error(`Erro ao salvar PDF: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('fiscal-files')
        .getPublicUrl(filePath);

      console.log('[PDF] Public URL:', urlData.publicUrl);

      // Update report with PDF URL and status
      const { error: updateError } = await supabase
        .from('fiscal_reports')
        .update({
          pdf_url: urlData.publicUrl,
          status: 'finished',
          updated_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      if (updateError) {
        console.error('[PDF] Update error:', updateError);
        throw new Error(`Erro ao atualizar relatório: ${updateError.message}`);
      }

      toast({
        title: "PDF Final Gerado!",
        description: "O relatório foi concluído e o PDF está disponível para download.",
      });

    } catch (error) {
      console.error('[PDF] Error:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao gerar PDF';
      toast({
        title: "Erro ao gerar PDF",
        description: message,
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
      generateFiscalPDF(report, reviews, fiscalSignatures, diligenceStatus, treasurerSignature || undefined, profiles);
      toast({
        title: "PDF Gerado",
        description: "O relatório foi exportado com sucesso.",
      });
    }
  };

  const generateTooltip = getGenerateTooltip();

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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-y border-border">
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
          
          {/* Assinaturas Fiscais */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Fiscais</p>
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

          {/* Assinatura Tesoureiro */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Tesoureiro</p>
            <div className="flex items-center justify-center gap-1">
              {hasTreasurerSigned ? (
                <Badge className="bg-green-500 text-white gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Assinado
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
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

          {/* Sign as Treasurer Button */}
          {canSignAsTreasurer && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onSignAsTreasurer}
              className="gap-1 border-amber-500 text-amber-600 hover:bg-amber-50"
            >
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Assinar</span>
            </Button>
          )}
          
          {/* Generate Final PDF Button */}
          {!hasFinalPdf && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={handleGenerateFinalPDF}
                      disabled={!canGenerateFinal || isGenerating}
                      className={cn(
                        "gap-1",
                        canGenerateFinal ? "bg-amber-600 hover:bg-amber-700" : "opacity-50"
                      )}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileCheck className="h-4 w-4" />
                      )}
                      {isGenerating ? 'Gerando...' : 'Gerar PDF'}
                    </Button>
                  </span>
                </TooltipTrigger>
                {generateTooltip && (
                  <TooltipContent>
                    <p>{generateTooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}

          {/* PDF Generated Badge */}
          {hasFinalPdf && (
            <Badge className="bg-green-500 text-white gap-1 py-1.5 px-3">
              <CheckCircle2 className="h-3 w-3" />
              PDF Gerado
            </Badge>
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
