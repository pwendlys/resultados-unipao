import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Calendar, Loader2 } from 'lucide-react';
import { useCooperadoReports } from '@/hooks/useCooperadoReports';
import { useToast } from '@/hooks/use-toast';
import { generateCustomReport } from '@/utils/customPdfGenerator';
import ReportPreview from '@/components/custom-reports/ReportPreview';
import { useCategories } from '@/hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const { toast } = useToast();

  // Função para extrair mês e ano do período do relatório
  const getReportPeriodInfo = (report: any) => {
    const dateFrom = report.config.dateFrom ? new Date(report.config.dateFrom) : null;
    return {
      month: dateFrom ? dateFrom.getMonth() + 1 : null,
      year: dateFrom ? dateFrom.getFullYear() : null
    };
  };

  // Extrair anos disponíveis dinamicamente
  const availableYears = useMemo(() => {
    if (!reports) return [];
    const years = new Set<number>();
    reports.forEach(report => {
      const { year } = getReportPeriodInfo(report);
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  // Filtrar e ordenar relatórios
  const filteredAndSortedReports = useMemo(() => {
    if (!reports) return [];
    
    let filtered = [...reports];
    
    // Filtrar por mês
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(report => {
        const { month } = getReportPeriodInfo(report);
        return month === parseInt(selectedMonth);
      });
    }
    
    // Filtrar por ano
    if (selectedYear !== 'all') {
      filtered = filtered.filter(report => {
        const { year } = getReportPeriodInfo(report);
        return year === parseInt(selectedYear);
      });
    }
    
    // Ordenar por data (mais recente primeiro)
    return filtered.sort((a, b) => {
      const dateA = a.config.dateFrom ? new Date(a.config.dateFrom).getTime() : 0;
      const dateB = b.config.dateFrom ? new Date(b.config.dateFrom).getTime() : 0;
      return dateB - dateA;
    });
  }, [reports, selectedMonth, selectedYear]);

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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Filtrar por Mês</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              <SelectItem value="1">Janeiro</SelectItem>
              <SelectItem value="2">Fevereiro</SelectItem>
              <SelectItem value="3">Março</SelectItem>
              <SelectItem value="4">Abril</SelectItem>
              <SelectItem value="5">Maio</SelectItem>
              <SelectItem value="6">Junho</SelectItem>
              <SelectItem value="7">Julho</SelectItem>
              <SelectItem value="8">Agosto</SelectItem>
              <SelectItem value="9">Setembro</SelectItem>
              <SelectItem value="10">Outubro</SelectItem>
              <SelectItem value="11">Novembro</SelectItem>
              <SelectItem value="12">Dezembro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Filtrar por Ano</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os anos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {(selectedMonth !== 'all' || selectedYear !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => { setSelectedMonth('all'); setSelectedYear('all'); }}
            className="self-end"
          >
            Limpar filtros
          </Button>
        )}
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
      ) : filteredAndSortedReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum relatório encontrado</p>
            <p className="text-sm text-muted-foreground">
              Não há relatórios para o período selecionado
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => { setSelectedMonth('all'); setSelectedYear('all'); }}
            >
              Ver todos os relatórios
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedReports.map((report) => (
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
