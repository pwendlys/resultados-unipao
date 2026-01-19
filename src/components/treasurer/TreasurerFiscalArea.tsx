import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  Eye, 
  Download, 
  FileText,
  AlertCircle,
  PenTool,
  FileCheck,
  Loader2
} from 'lucide-react';
import { useAllFiscalReports } from '@/hooks/useFiscalReports';
import { useTreasurerReportsSummary, TreasurerReportSummary } from '@/hooks/useTreasurerReportsSummary';
import { useFiscalReviews } from '@/hooks/useFiscalReviews';
import { useFiscalSignatures } from '@/hooks/useFiscalSignatures';
import { useTransactionDiligenceStatus } from '@/hooks/useFiscalUserReviews';
import { useToast } from '@/hooks/use-toast';
import { generateFiscalPDF, generateFiscalPDFBlob } from '@/utils/fiscalPdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import FiscalSignaturesModal from '@/components/fiscal/FiscalSignaturesModal';
import FiscalDiligencesModal from '@/components/fiscal/FiscalDiligencesModal';

interface TreasurerFiscalAreaProps {
  onNavigateToPage?: (page: string) => void;
}

const TreasurerFiscalArea = ({ onNavigateToPage }: TreasurerFiscalAreaProps) => {
  const { toast } = useToast();
  const { data: reports = [], isLoading } = useAllFiscalReports();
  const { data: summaries = [] } = useTreasurerReportsSummary();

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
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Fiscais ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Diligências</TableHead>
                    <TableHead>Assinaturas</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const summary = summaries.find(s => s.reportId === report.id);
                    return (
                      <TreasurerReportRow 
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
                        getStatusBadge={getStatusBadge}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
};

// Componente separado para cada linha da tabela
interface TreasurerReportRowProps {
  report: any;
  summary: TreasurerReportSummary | undefined;
  onViewSignatures: () => void;
  onViewDiligences: () => void;
  getStatusBadge: (summary: TreasurerReportSummary | undefined, status: string) => JSX.Element;
}

const TreasurerReportRow = ({ 
  report, 
  summary,
  onViewSignatures, 
  onViewDiligences, 
  getStatusBadge 
}: TreasurerReportRowProps) => {
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
    <TableRow>
      <TableCell className="font-medium">{report.title}</TableCell>
      <TableCell>{report.competencia}</TableCell>
      <TableCell>{report.account_type}</TableCell>
      <TableCell>{getStatusBadge(summary, report.status)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2 min-w-[150px]">
          <Progress value={progressPercentage} className="h-2 w-16" />
          <div className="flex items-center gap-1 text-xs">
            <span className="text-green-600" title="Aprovadas (3/3 revisões)">{approvedCount}</span>
            <span>/</span>
            <span className="text-muted-foreground" title="Pendentes">{pendingCount}</span>
            <span>/</span>
            <span className="text-orange-600" title="Diligências">{diligenceCount}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {diligenceCount > 0 ? (
          <Badge 
            variant="outline" 
            className={allDiligencesConfirmed ? "text-green-600 border-green-500" : "text-orange-600 border-orange-500"}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            {diligenceCount} {allDiligencesConfirmed ? '✓' : ''}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Nenhuma</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <PenTool className="h-4 w-4 text-muted-foreground" />
          <span className={signatureCount >= 3 ? 'text-green-600 font-medium' : ''}>
            {signatureCount}/3
          </span>
        </div>
      </TableCell>
      <TableCell>
        {new Date(report.created_at).toLocaleDateString('pt-BR')}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={onViewSignatures} title="Ver Assinaturas">
            <PenTool className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onViewDiligences} title="Ver Diligências">
            <Eye className="h-4 w-4" />
          </Button>
          
          {/* Generate Final PDF Button */}
          {canGenerateFinal && (
            <Button 
              variant="default"
              size="sm"
              onClick={handleGenerateFinalPDF}
              disabled={isGenerating}
              className="bg-amber-600 hover:bg-amber-700"
              title="Gerar Relatório Final"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4 mr-1" />
              )}
              {isGenerating ? 'Gerando...' : 'Gerar Final'}
            </Button>
          )}
          
          {/* Download PDF Button */}
          {(hasFinalPdf || isFinished) && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDownloadPDF}
              title="Baixar PDF Final"
              className="text-green-600"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TreasurerFiscalArea;
