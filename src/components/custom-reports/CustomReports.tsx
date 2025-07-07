
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Eye } from 'lucide-react';
import { useTransactions } from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { ReportBuilder } from './ReportBuilder';
import { ReportPreview } from './ReportPreview';
import { generateCustomReport } from '@/utils/customPdfGenerator';

export interface CustomReportConfig {
  selectedAccounts: string[];
  dateFrom?: Date;
  dateTo?: Date;
  includeEntries: boolean;
  includeExits: boolean;
  selectedCategories: string[];
  reportTitle: string;
}

const CustomReports = () => {
  const [reportConfig, setReportConfig] = useState<CustomReportConfig>({
    selectedAccounts: [],
    dateFrom: undefined,
    dateTo: undefined,
    includeEntries: true,
    includeExits: true,
    selectedCategories: [],
    reportTitle: 'Relatório Operacional Personalizado'
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      console.log('Gerando relatório personalizado:', reportConfig);
      
      const filteredData = getFilteredData();
      
      if (filteredData.filteredTransactions.length === 0) {
        toast({
          title: "Nenhuma Transação Encontrada",
          description: "Não há transações que atendam aos critérios selecionados.",
          variant: "destructive",
        });
        return;
      }

      await generateCustomReport(filteredData, reportConfig);
      
      toast({
        title: "Relatório Gerado com Sucesso",
        description: "O relatório personalizado foi exportado em PDF.",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao Gerar Relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredData = () => {
    let filteredTransactions = transactions;

    // Filtrar por contas selecionadas (se alguma foi selecionada)
    if (reportConfig.selectedAccounts.length > 0) {
      // Como as transações não têm account_type diretamente, precisamos filtrar através dos extratos
      // Por enquanto, vamos assumir que todas as transações estão incluídas
      filteredTransactions = transactions;
    }

    // Filtrar por período
    if (reportConfig.dateFrom || reportConfig.dateTo) {
      filteredTransactions = filteredTransactions.filter(transaction => {
        let transactionDate;
        try {
          if (transaction.date.includes('/')) {
            const [day, month, year] = transaction.date.split('/');
            transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            transactionDate = new Date(transaction.date);
          }
        } catch (error) {
          return false;
        }
        
        const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        
        if (reportConfig.dateFrom && reportConfig.dateTo) {
          const dateFromOnly = new Date(reportConfig.dateFrom.getFullYear(), reportConfig.dateFrom.getMonth(), reportConfig.dateFrom.getDate());
          const dateToOnly = new Date(reportConfig.dateTo.getFullYear(), reportConfig.dateTo.getMonth(), reportConfig.dateTo.getDate());
          return transactionDateOnly >= dateFromOnly && transactionDateOnly <= dateToOnly;
        } else if (reportConfig.dateFrom) {
          const dateFromOnly = new Date(reportConfig.dateFrom.getFullYear(), reportConfig.dateFrom.getMonth(), reportConfig.dateFrom.getDate());
          return transactionDateOnly >= dateFromOnly;
        } else if (reportConfig.dateTo) {
          const dateToOnly = new Date(reportConfig.dateTo.getFullYear(), reportConfig.dateTo.getMonth(), reportConfig.dateTo.getDate());
          return transactionDateOnly <= dateToOnly;
        }
        
        return true;
      });
    }

    // Filtrar por tipo (entrada/saída)
    if (!reportConfig.includeEntries || !reportConfig.includeExits) {
      filteredTransactions = filteredTransactions.filter(transaction => {
        if (!reportConfig.includeEntries && transaction.type === 'entrada') return false;
        if (!reportConfig.includeExits && transaction.type === 'saida') return false;
        return true;
      });
    }

    // Filtrar por categorias selecionadas
    if (reportConfig.selectedCategories.length > 0) {
      filteredTransactions = filteredTransactions.filter(transaction => 
        transaction.category && reportConfig.selectedCategories.includes(transaction.category)
      );
    }

    // Calcular totais
    const categorizedTransactions = filteredTransactions.filter(t => t.status === 'categorizado');
    
    const entryTransactions = categorizedTransactions.filter(t => t.type === 'entrada');
    const exitTransactions = categorizedTransactions.filter(t => t.type === 'saida');
    
    const totalEntries = entryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExits = exitTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const netResult = totalEntries - totalExits;

    return {
      filteredTransactions,
      categorizedTransactions,
      entryTransactions,
      exitTransactions,
      totalEntries,
      totalExits,
      netResult
    };
  };

  if (transactionsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Personalizados</h1>
          <p className="text-muted-foreground">
            Crie relatórios operacionais personalizados com critérios específicos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Ocultar Preview' : 'Visualizar Preview'}
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={isExporting || reportConfig.selectedAccounts.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
          </Button>
        </div>
      </div>

      {/* Report Builder */}
      <ReportBuilder
        config={reportConfig}
        onConfigChange={setReportConfig}
        categories={categories}
      />

      {/* Report Preview */}
      {showPreview && (
        <ReportPreview
          config={reportConfig}
          data={getFilteredData()}
          categories={categories}
        />
      )}
    </div>
  );
};

export default CustomReports;
