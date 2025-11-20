
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Eye, Send } from 'lucide-react';
import { useTransactionsByAccount, useExtratos } from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { ReportBuilder } from './ReportBuilder';
import ReportPreview from './ReportPreview';
import { generateCustomReport } from '@/utils/customPdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CustomReportConfig {
  selectedAccounts: string[];
  dateFrom?: Date;
  dateTo?: Date;
  includeEntries: boolean;
  includeExits: boolean;
  selectedCategories: string[];
  reportTitle: string;
  detailGrouping?: 'date' | 'category';
}

const CustomReports = () => {
const [reportConfig, setReportConfig] = useState<CustomReportConfig>({
  selectedAccounts: [],
  dateFrom: undefined,
  dateTo: undefined,
  includeEntries: true,
  includeExits: true,
  selectedCategories: [],
  reportTitle: 'Relatório Operacional Personalizado',
  detailGrouping: 'date'
});
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingToCooperado, setIsSendingToCooperado] = useState(false);

  // Buscar todas as transações e extratos para permitir filtro múltiplo
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactionsByAccount('ALL');
  const { data: extratos = [], isLoading: extratosLoading } = useExtratos();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleSendToCooperado = async () => {
    if (isSendingToCooperado) return;
    
    try {
      setIsSendingToCooperado(true);
      const filteredData = getFilteredData();
      
      if (filteredData.filteredTransactions.length === 0) {
        toast({
          title: "Nenhuma Transação",
          description: "Não há transações para enviar ao cooperado.",
          variant: "destructive",
        });
        return;
      }

      // Criar registro na tabela shared_reports
      const { error } = await supabase
        .from('shared_reports')
        .insert([{
          title: reportConfig.reportTitle,
          config: reportConfig as any,
          data: filteredData as any,
          share_id: crypto.randomUUID(),
          sent_to_cooperado: true,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Relatório Enviado!",
        description: "O relatório foi enviado para o painel do cooperado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast({
        title: "Erro ao Enviar",
        description: "Não foi possível enviar o relatório ao cooperado.",
        variant: "destructive",
      });
    } finally {
      setIsSendingToCooperado(false);
    }
  };

  // Função auxiliar para parsear diferentes formatos de data
  const parseTransactionDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // Formato DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }
    
    // Formato YYYY-MM-DD ou similar
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Fallback: tentar new Date() direto
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const getFilteredData = () => {
    console.log('Filtrando dados com configuração:', reportConfig);
    console.log('Transações recebidas do hook:', transactions.length);
    
    let filteredTransactions = transactions;

    // Filtrar por contas selecionadas
    if (reportConfig.selectedAccounts.length > 0) {
      // Criar mapa de extrato_id para account_type
      const extratoMap = new Map(
        extratos.map(e => [e.id, e.account_type])
      );

      filteredTransactions = filteredTransactions.filter(transaction => {
        if (!transaction.extrato_id) return false;
        const accountType = extratoMap.get(transaction.extrato_id);
        return accountType && reportConfig.selectedAccounts.includes(accountType);
      });

      console.log('Transações após filtro de contas:', filteredTransactions.length);
      console.log('Contas selecionadas:', reportConfig.selectedAccounts);
      
      if (filteredTransactions.length === 0) {
        console.warn('⚠️ AVISO: Filtro de contas resultou em 0 transações!');
        console.warn('Contas disponíveis nos extratos:', Array.from(new Set(extratos.map(e => e.account_type))));
      }
    } else {
      console.log('Nenhuma conta selecionada - incluindo todas as contas');
    }

    // Filtrar por período (reforçado)
    if (reportConfig.dateFrom || reportConfig.dateTo) {
      const dateFromOnly = reportConfig.dateFrom 
        ? new Date(reportConfig.dateFrom.getFullYear(), reportConfig.dateFrom.getMonth(), reportConfig.dateFrom.getDate()) 
        : null;
      const dateToOnly = reportConfig.dateTo 
        ? new Date(reportConfig.dateTo.getFullYear(), reportConfig.dateTo.getMonth(), reportConfig.dateTo.getDate()) 
        : null;

      filteredTransactions = filteredTransactions.filter((transaction) => {
        const parsed = parseTransactionDate(transaction.date);
        
        if (!parsed) {
          console.warn('Data de transação inválida (mantida no relatório):', transaction.date);
          return true; // Manter transação mesmo com data inválida
        }
        
        const transactionDateOnly = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        
        if (dateFromOnly && transactionDateOnly < dateFromOnly) return false;
        if (dateToOnly && transactionDateOnly > dateToOnly) return false;
        
        return true;
      });

      console.log('Transações após filtro de período:', filteredTransactions.length);
    }

    // Filtrar por tipo (entrada/saída)
    if (!reportConfig.includeEntries || !reportConfig.includeExits) {
      filteredTransactions = filteredTransactions.filter(transaction => {
        if (!reportConfig.includeEntries && transaction.type === 'entrada') return false;
        if (!reportConfig.includeExits && transaction.type === 'saida') return false;
        return true;
      });
    }

    console.log('Transações após filtro de tipo:', filteredTransactions.length);

    // Filtrar por categorias selecionadas
    if (reportConfig.selectedCategories.length > 0) {
      filteredTransactions = filteredTransactions.filter((transaction) => 
        transaction.category && reportConfig.selectedCategories.includes(transaction.category)
      );
      console.log('Transações após filtro de categorias:', filteredTransactions.length);
      console.log('Categorias selecionadas:', reportConfig.selectedCategories);
      
      if (filteredTransactions.length === 0) {
        console.warn('⚠️ AVISO: Filtro de categorias resultou em 0 transações!');
        console.warn('Categorias disponíveis:', Array.from(new Set(transactions.filter(t => t.category).map(t => t.category))));
      }
    } else {
      console.log('Nenhuma categoria selecionada - incluindo todas as categorias');
    }

    // Calcular totais
    const categorizedTransactions = filteredTransactions.filter(t => t.status === 'categorizado');
    
    const entryTransactions = categorizedTransactions.filter(t => t.type === 'entrada');
    const exitTransactions = categorizedTransactions.filter(t => t.type === 'saida');
    
    const totalEntries = entryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExits = exitTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const netResult = totalEntries - totalExits;

    console.log('Dados finais do relatório:', {
      filteredTransactions: filteredTransactions.length,
      categorizedTransactions: categorizedTransactions.length,
      totalEntries,
      totalExits,
      netResult
    });

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

  if (transactionsLoading || categoriesLoading || extratosLoading) {
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
          {user?.role === 'admin' && (
            <Button 
              onClick={handleSendToCooperado}
              disabled={isSendingToCooperado || reportConfig.selectedAccounts.length === 0}
              variant="secondary"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSendingToCooperado ? 'Enviando...' : 'Enviar p/ Cooperado'}
            </Button>
          )}
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
