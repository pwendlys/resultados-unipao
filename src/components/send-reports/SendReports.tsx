import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Eye, Shield } from 'lucide-react';
import { useAllCategorizedTransactions } from '@/hooks/useAllCategorizedTransactions';
import { useExtratos } from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { SendReportBuilder } from './SendReportBuilder';
import SendReportPreview from './SendReportPreview';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SendReportConfig {
  selectedAccounts: string[];
  dateFrom?: Date;
  dateTo?: Date;
  includeEntries: boolean;
  includeExits: boolean;
  selectedCategories: string[];
  reportTitle: string;
  detailGrouping?: 'date' | 'category';
}

const SendReports = () => {
  const [reportConfig, setReportConfig] = useState<SendReportConfig>({
    selectedAccounts: [],
    dateFrom: undefined,
    dateTo: undefined,
    includeEntries: true,
    includeExits: true,
    selectedCategories: [],
    reportTitle: 'Relatório de Transações Categorizadas',
    detailGrouping: 'date',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingFiscal, setIsSendingFiscal] = useState(false);

  // Hook dedicado para transações categorizadas
  const { data: categorizedTransactions = [], isLoading: transactionsLoading } = useAllCategorizedTransactions();
  const { data: extratos = [], isLoading: extratosLoading } = useExtratos();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { toast } = useToast();
  const { user } = useAuth();

  // Função para parsear datas (DD/MM/YYYY -> Date)
  const parseTransactionDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day, 0, 0, 0, 0);
        }
      }
    }
    
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }
    
    return null;
  };

  const getFilteredData = () => {
    console.log('🔍 Filtrando transações categorizadas:', reportConfig);
    console.log('📊 Total de transações categorizadas recebidas:', categorizedTransactions.length);
    
    let filtered = [...categorizedTransactions];

    // Filtrar por contas
    if (reportConfig.selectedAccounts.length > 0) {
      const extratoMap = new Map(extratos.map(e => [e.id, e.account_type]));
      
      filtered = filtered.filter(transaction => {
        if (!transaction.extrato_id) return false;
        const accountType = extratoMap.get(transaction.extrato_id);
        return accountType && reportConfig.selectedAccounts.includes(accountType);
      });

      console.log('✅ Após filtro de contas:', filtered.length);
    }

    // Filtrar por período (timezone-safe)
    if (reportConfig.dateFrom || reportConfig.dateTo) {
      const fromTimestamp = reportConfig.dateFrom 
        ? new Date(
            reportConfig.dateFrom.getFullYear(), 
            reportConfig.dateFrom.getMonth(), 
            reportConfig.dateFrom.getDate(),
            0, 0, 0, 0
          ).getTime()
        : null;
        
      const toTimestamp = reportConfig.dateTo 
        ? new Date(
            reportConfig.dateTo.getFullYear(), 
            reportConfig.dateTo.getMonth(), 
            reportConfig.dateTo.getDate(),
            23, 59, 59, 999
          ).getTime()
        : null;

      console.log('📅 Filtro de período:', {
        from: fromTimestamp ? new Date(fromTimestamp).toISOString() : null,
        to: toTimestamp ? new Date(toTimestamp).toISOString() : null
      });

      filtered = filtered.filter(transaction => {
        const parsed = parseTransactionDate(transaction.date);
        if (!parsed) return false;
        
        const time = parsed.getTime();
        if (fromTimestamp && time < fromTimestamp) return false;
        if (toTimestamp && time > toTimestamp) return false;
        return true;
      });

      console.log('✅ Após filtro de período:', filtered.length);
    }

    // Filtrar por tipo
    if (!reportConfig.includeEntries || !reportConfig.includeExits) {
      filtered = filtered.filter(transaction => {
        if (!reportConfig.includeEntries && transaction.type === 'entrada') return false;
        if (!reportConfig.includeExits && transaction.type === 'saida') return false;
        return true;
      });

      console.log('✅ Após filtro de tipo:', filtered.length);
    }

    // Filtrar por categorias
    if (reportConfig.selectedCategories.length > 0) {
      filtered = filtered.filter(transaction => 
        transaction.category && reportConfig.selectedCategories.includes(transaction.category)
      );

      console.log('✅ Após filtro de categorias:', filtered.length);
    }

    // Calcular totais
    const entryTransactions = filtered.filter(t => t.type === 'entrada');
    const exitTransactions = filtered.filter(t => t.type === 'saida');
    
    const totalEntries = entryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExits = exitTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const netResult = totalEntries - totalExits;

    console.log('📈 Resultado final:', {
      filtered: filtered.length,
      entries: entryTransactions.length,
      exits: exitTransactions.length,
      totalEntries,
      totalExits,
      netResult
    });

    return {
      filteredTransactions: filtered,
      categorizedTransactions: filtered,
      entryTransactions,
      exitTransactions,
      totalEntries,
      totalExits,
      netResult
    };
  };

  const handleSendToCooperado = async () => {
    if (isSending) return;
    
    try {
      setIsSending(true);
      const filteredData = getFilteredData();
      
      if (filteredData.filteredTransactions.length === 0) {
        toast({
          title: "Nenhuma Transação",
          description: "Não há transações categorizadas para enviar.",
          variant: "destructive",
        });
        return;
      }

      // Enviar para painel do cooperado
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
        description: `${filteredData.filteredTransactions.length} transações enviadas para o painel do cooperado com sucesso.`,
      });

      // Limpar formulário
      setReportConfig({
        selectedAccounts: [],
        dateFrom: undefined,
        dateTo: undefined,
        includeEntries: true,
        includeExits: true,
        selectedCategories: [],
        reportTitle: 'Relatório de Transações Categorizadas',
        detailGrouping: 'date',
      });
      setShowPreview(false);
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast({
        title: "Erro ao Enviar",
        description: "Não foi possível enviar o relatório ao cooperado.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToFiscal = async () => {
    if (isSendingFiscal) return;
    
    try {
      setIsSendingFiscal(true);
      const filteredData = getFilteredData();
      
      if (filteredData.filteredTransactions.length === 0) {
        toast({
          title: "Nenhuma Transação",
          description: "Não há transações categorizadas para enviar ao fiscal.",
          variant: "destructive",
        });
        return;
      }

      // Identificar o extrato e tipo de conta
      const accountType = reportConfig.selectedAccounts[0] || 'conta_corrente';
      const competencia = reportConfig.dateFrom 
        ? `${reportConfig.dateFrom.getMonth() + 1}/${reportConfig.dateFrom.getFullYear()}`
        : new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });

      // Buscar extrato_id das transações
      const extratoId = filteredData.filteredTransactions[0]?.extrato_id || null;

      // Criar relatório fiscal
      const { data: fiscalReport, error: reportError } = await supabase
        .from('fiscal_reports')
        .insert([{
          title: reportConfig.reportTitle,
          competencia,
          account_type: accountType,
          extrato_id: extratoId,
          sent_by: user?.email || 'admin',
          total_entries: filteredData.filteredTransactions.length,
          pending_count: filteredData.filteredTransactions.length,
          approved_count: 0,
          flagged_count: 0,
          status: 'open'
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      // Criar fiscal_reviews para cada transação
      const reviews = filteredData.filteredTransactions.map((transaction, index) => ({
        fiscal_report_id: fiscalReport.id,
        transaction_id: transaction.id,
        entry_index: transaction.entry_index ?? index + 1,
        status: 'pending'
      }));

      const { error: reviewsError } = await supabase
        .from('fiscal_reviews')
        .insert(reviews);

      if (reviewsError) throw reviewsError;

      toast({
        title: "Enviado para Fiscal!",
        description: `Relatório com ${filteredData.filteredTransactions.length} transações criado para revisão fiscal.`,
      });

      // Limpar formulário
      setReportConfig({
        selectedAccounts: [],
        dateFrom: undefined,
        dateTo: undefined,
        includeEntries: true,
        includeExits: true,
        selectedCategories: [],
        reportTitle: 'Relatório de Transações Categorizadas',
        detailGrouping: 'date',
      });
      setShowPreview(false);
    } catch (error) {
      console.error('Erro ao enviar para fiscal:', error);
      toast({
        title: "Erro ao Enviar",
        description: "Não foi possível criar o relatório fiscal.",
        variant: "destructive",
      });
    } finally {
      setIsSendingFiscal(false);
    }
  };

  if (transactionsLoading || categoriesLoading || extratosLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando transações categorizadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Enviar</h1>
          <p className="text-muted-foreground">
            Envie relatórios com todas as transações categorizadas para o painel do cooperado
          </p>
          <p className="text-sm text-blue-600 mt-1">
            ✅ {categorizedTransactions.length} transações categorizadas disponíveis no banco de dados
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Ocultar Preview' : 'Visualizar Preview'}
          </Button>
          <Button 
            onClick={handleSendToFiscal}
            disabled={isSendingFiscal || reportConfig.selectedAccounts.length === 0}
            variant="secondary"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isSendingFiscal ? 'Enviando...' : 'Enviar para Fiscal'}
          </Button>
          <Button 
            onClick={handleSendToCooperado}
            disabled={isSending || reportConfig.selectedAccounts.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Enviando...' : 'Enviar para Cooperado'}
          </Button>
        </div>
      </div>

      {/* Report Builder */}
      <SendReportBuilder
        config={reportConfig}
        onConfigChange={setReportConfig}
        categories={categories}
      />

      {/* Report Preview */}
      {showPreview && (
        <SendReportPreview
          config={reportConfig}
          data={getFilteredData()}
          categories={categories}
        />
      )}
    </div>
  );
};

export default SendReports;
