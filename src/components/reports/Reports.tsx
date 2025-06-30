
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTransactionsByAccount } from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';
import { generateDREReport } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ReportFilters, AccountType, ACCOUNT_TYPES } from './ReportFilters';
import { ReportSummaryCards } from './ReportSummaryCards';
import { DRESections } from './DRESections';

const Reports = () => {
  const [selectedAccount, setSelectedAccount] = useState<AccountType>('ALL');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactionsByAccount(selectedAccount);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { toast } = useToast();

  // Filtrar transações por período se as datas foram selecionadas
  const filteredTransactions = transactions.filter(transaction => {
    if (!dateFrom && !dateTo) return true;
    
    const transactionDate = new Date(transaction.date);
    
    if (dateFrom && dateTo) {
      return transactionDate >= dateFrom && transactionDate <= dateTo;
    } else if (dateFrom) {
      return transactionDate >= dateFrom;
    } else if (dateTo) {
      return transactionDate <= dateTo;
    }
    
    return true;
  });

  const categorizedTransactions = filteredTransactions.filter(t => t.status === 'categorizado');
  
  // Calcular totais por categoria
  const categoryTotals = categories.map(category => {
    const categoryTransactions = categorizedTransactions.filter(t => t.category === category.name);
    const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      ...category,
      total,
      transactionCount: categoryTransactions.length,
      transactions: categoryTransactions
    };
  });

  // Filtrar apenas categorias com valores (total > 0)
  const entryCategories = categoryTotals.filter(c => c.type === 'entrada' && c.total > 0);
  const exitCategories = categoryTotals.filter(c => c.type === 'saida' && c.total > 0);

  const totalEntries = entryCategories.reduce((sum, c) => sum + c.total, 0);
  const totalExits = exitCategories.reduce((sum, c) => sum + c.total, 0);
  const netResult = totalEntries - totalExits;

  const handleExportPDF = async () => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      console.log('Iniciando exportação PDF...');
      
      if (!filteredTransactions || filteredTransactions.length === 0) {
        toast({
          title: "Nenhuma Transação Encontrada",
          description: "Não há transações para gerar o relatório no período selecionado.",
          variant: "destructive",
        });
        return;
      }

      const reportData = {
        selectedAccount: ACCOUNT_TYPES.find(type => type.value === selectedAccount)?.label || selectedAccount,
        entryCategories,
        exitCategories,
        totalEntries,
        totalExits,
        netResult,
        categorizedTransactions,
        allTransactions: filteredTransactions,
        period: {
          from: dateFrom ? format(dateFrom, 'dd/MM/yyyy') : null,
          to: dateTo ? format(dateTo, 'dd/MM/yyyy') : null
        }
      };

      console.log('Dados do relatório preparados:', reportData);
      
      await generateDREReport(reportData);
      
      toast({
        title: "PDF Gerado com Sucesso",
        description: "O relatório DRE foi exportado e baixado.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao Gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const clearPeriodFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (transactionsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Relatórios DRE</h1>
          <p className="text-muted-foreground">
            Demonstrativo do Resultado do Exercício por categorias
          </p>
        </div>
        <Button 
          onClick={handleExportPDF}
          disabled={isExporting || transactionsLoading || categoriesLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>

      {/* Filters */}
      <ReportFilters
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onClearPeriodFilter={clearPeriodFilter}
      />

      {/* Summary Cards */}
      <ReportSummaryCards
        totalEntries={totalEntries}
        totalExits={totalExits}
        netResult={netResult}
        categorizedTransactionsCount={categorizedTransactions.length}
        filteredTransactionsCount={filteredTransactions.length}
        entryTransactionsCount={entryCategories.reduce((sum, c) => sum + c.transactionCount, 0)}
        exitTransactionsCount={exitCategories.reduce((sum, c) => sum + c.transactionCount, 0)}
      />

      {/* DRE Sections */}
      <DRESections
        entryCategories={entryCategories}
        exitCategories={exitCategories}
        totalEntries={totalEntries}
        totalExits={totalExits}
        netResult={netResult}
        selectedAccount={selectedAccount}
      />
    </div>
  );
};

export default Reports;
