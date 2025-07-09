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

  // Filtrar transações por período baseado na data REAL das transações
  const filteredTransactions = transactions.filter(transaction => {
    // Se não há filtros de data, retorna todas as transações
    if (!dateFrom && !dateTo) return true;
    
    // Converter a data da transação para objeto Date
    // A data vem como string no formato 'DD/MM/YYYY' ou 'YYYY-MM-DD'
    let transactionDate;
    try {
      // Verificar se a data está no formato brasileiro DD/MM/YYYY
      if (transaction.date.includes('/')) {
        const [day, month, year] = transaction.date.split('/');
        transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Assumir formato ISO YYYY-MM-DD
        transactionDate = new Date(transaction.date);
      }
    } catch (error) {
      console.error('Erro ao converter data da transação:', transaction.date, error);
      return false; // Excluir transações com datas inválidas
    }
    
    // Resetar o horário para comparação apenas da data
    const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
    
    // Aplicar filtros de data
    if (dateFrom && dateTo) {
      const dateFromOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
      const dateToOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
      return transactionDateOnly >= dateFromOnly && transactionDateOnly <= dateToOnly;
    } else if (dateFrom) {
      const dateFromOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
      return transactionDateOnly >= dateFromOnly;
    } else if (dateTo) {
      const dateToOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
      return transactionDateOnly <= dateToOnly;
    }
    
    return true;
  });

  // Filtrar apenas transações categorizadas E do período selecionado
  const categorizedTransactions = filteredTransactions.filter(t => t.status === 'categorizado');
  
  // Calcular totais por categoria APENAS com transações do período filtrado
  const categoryTotals = categories.map(category => {
    const categoryTransactions = categorizedTransactions.filter(t => t.category === category.name);
    const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalInterest = categoryTransactions.reduce((sum, t) => sum + (Number(t.juros) || 0), 0);
    
    return {
      ...category,
      total,
      totalInterest,
      transactionCount: categoryTransactions.length,
      transactions: categoryTransactions
    };
  });

  // Filtrar apenas categorias com valores (total > 0) do período selecionado
  const entryCategories = categoryTotals.filter(c => c.type === 'entrada' && c.total > 0);
  const exitCategories = categoryTotals.filter(c => c.type === 'saida' && c.total > 0);

  const totalEntries = entryCategories.reduce((sum, c) => sum + c.total, 0);
  const totalExits = exitCategories.reduce((sum, c) => sum + c.total, 0);
  const totalInterest = categoryTotals.reduce((sum, c) => sum + c.totalInterest, 0);
  const netResult = totalEntries - totalExits;

  const handleExportPDF = async () => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      console.log('Iniciando exportação PDF com juros incluídos...');
      
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
        totalInterest,
        netResult,
        categorizedTransactions,
        allTransactions: filteredTransactions,
        period: {
          from: dateFrom ? format(dateFrom, 'dd/MM/yyyy') : null,
          to: dateTo ? format(dateTo, 'dd/MM/yyyy') : null
        }
      };

      console.log('Dados do relatório preparados com juros:', reportData);
      
      await generateDREReport(reportData);
      
      toast({
        title: "PDF Gerado com Sucesso",
        description: "O relatório operacional foi exportado com os juros incluídos.",
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
          <h1 className="text-3xl font-bold">Relatório Operacional Unipão</h1>
          <p className="text-muted-foreground">
            Demonstrativo do Resultado do Exercício por categorias
          </p>
          {(dateFrom || dateTo) && (
            <p className="text-sm text-blue-600 mt-2">
              Filtrado por período: {dateFrom && dateTo 
                ? `${format(dateFrom, 'dd/MM/yyyy')} até ${format(dateTo, 'dd/MM/yyyy')}`
                : dateFrom 
                ? `A partir de ${format(dateFrom, 'dd/MM/yyyy')}`
                : `Até ${format(dateTo!, 'dd/MM/yyyy')}`
              }
            </p>
          )}
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
        totalInterest={totalInterest}
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
        totalInterest={totalInterest}
        netResult={netResult}
        selectedAccount={selectedAccount}
      />
    </div>
  );
};

export default Reports;
