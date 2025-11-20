import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Calendar, Loader2 } from 'lucide-react';
import { useCooperadoReports } from '@/hooks/useCooperadoReports';
import { useToast } from '@/hooks/use-toast';
import { generateCustomReport } from '@/utils/customPdfGenerator';
import ReportPreview from '@/components/custom-reports/ReportPreview';
import { useCategories } from '@/hooks/useCategories';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ResultadosUnipao = () => {
  const { data: reports, isLoading } = useCooperadoReports();
  const { data: categories = [] } = useCategories();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async (report: any) => {
    setIsGeneratingPDF(true);
    try {
      await generateCustomReport(report.data, report.config);
      toast({
        title: "PDF Gerado!",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Resultados Unipão</h1>
        <p className="text-muted-foreground mt-2">
          Relatórios financeiros enviados pela administração
        </p>
      </div>

      {/* Lista de Relatórios */}
      {!reports || reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum relatório disponível</p>
            <p className="text-sm text-muted-foreground">
              Os relatórios enviados pela administração aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg sm:text-xl leading-tight">{report.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      Enviado em {formatDate(report.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPDF(report)}
                      disabled={isGeneratingPDF}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {isGeneratingPDF ? "Gerando..." : "Baixar PDF"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Período:</span>
                    <p className="font-medium text-xs sm:text-sm break-words">
                      {report.config.dateFrom 
                        ? new Date(report.config.dateFrom).toLocaleDateString('pt-BR')
                        : 'Início'}{' '}
                      até{' '}
                      {report.config.dateTo 
                        ? new Date(report.config.dateTo).toLocaleDateString('pt-BR')
                        : 'Fim'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Contas:</span>
                    <p 
                      className="font-medium text-xs sm:text-sm break-words line-clamp-2" 
                      title={report.config.selectedAccounts?.length > 0 ? report.config.selectedAccounts.join(', ') : 'Todas as contas'}
                    >
                      {report.config.selectedAccounts?.length > 0
                        ? report.config.selectedAccounts.join(', ')
                        : 'Todas'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Transações:</span>
                    <p className="font-medium text-xs sm:text-sm">
                      {report.data.filteredTransactions?.length || 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Resultado:</span>
                    <p className={`font-medium text-xs sm:text-sm ${
                      (report.data.netResult || 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(report.data.netResult || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Preview */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{selectedReport?.title}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Visualização detalhada do relatório
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <ReportPreview
              data={selectedReport.data}
              config={selectedReport.config}
              categories={categories}
              isCooperadoView={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultadosUnipao;
