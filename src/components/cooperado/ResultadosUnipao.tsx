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
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Enviado em {formatDate(report.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPDF(report)}
                      disabled={isGeneratingPDF}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isGeneratingPDF ? "Gerando..." : "Baixar PDF"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Período:</span>
                    <p className="font-medium">
                      {report.config.dateFrom 
                        ? new Date(report.config.dateFrom).toLocaleDateString('pt-BR')
                        : 'Início'}{' '}
                      até{' '}
                      {report.config.dateTo 
                        ? new Date(report.config.dateTo).toLocaleDateString('pt-BR')
                        : 'Fim'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contas:</span>
                    <p className="font-medium">
                      {report.config.selectedAccounts?.length > 0
                        ? report.config.selectedAccounts.join(', ')
                        : 'Todas'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transações:</span>
                    <p className="font-medium">
                      {report.data.filteredTransactions?.length || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resultado:</span>
                    <p className={`font-medium ${
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              Visualização detalhada do relatório
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <ReportPreview
              data={selectedReport.data}
              config={selectedReport.config}
              categories={categories}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultadosUnipao;
