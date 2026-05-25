
import { useState } from 'react';
import { useTransactionsByAccount } from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';
import { useTransactionsActions } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import CategoryFilters from './CategoryFilters';
import TransactionTable from './TransactionTable';
import TransactionPagination from './TransactionPagination';
import BulkActionsBar from './BulkActionsBar';
import { filterTransactions } from './utils/transactionFilters';

const Categorization = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'description' | 'value'>('description');
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'entrada' | 'saida'>('ALL');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { data: transactions = [], isLoading, refetch } = useTransactionsByAccount(selectedAccount);
  const { data: categories = [] } = useCategories();
  const { updateTransaction, bulkUpdateTransactions } = useTransactionsActions();
  const { toast } = useToast();

  // Filter transactions based on search term, date range, and uncategorized filter
  const filteredTransactions = filterTransactions(transactions, searchTerm, dateRange, showOnlyUncategorized, searchType, categoryFilter, typeFilter);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions?.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = filteredTransactions ? Math.ceil(filteredTransactions.length / itemsPerPage) : 0;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleCategorize = async (transactionId: string, category: string, observation?: string) => {
    try {
      await updateTransaction.mutateAsync({
        id: transactionId,
        category: category,
        status: 'categorizado',
        observacao: observation,
      });

      toast({
        title: "Transação Categorizada",
        description: "A transação foi categorizada com sucesso.",
      });

      refetch();
    } catch (error) {
      console.error('Erro ao categorizar transação:', error);
      toast({
        title: "Erro ao Categorizar",
        description: "Ocorreu um erro ao categorizar a transação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleObservationUpdate = async (transactionId: string, observacao: string) => {
    try {
      await updateTransaction.mutateAsync({
        id: transactionId,
        observacao: observacao,
      });
      toast({
        title: "Observação atualizada",
        description: "A observação foi salva com sucesso.",
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar observação:', error);
      toast({
        title: "Erro ao atualizar observação",
        description: "Ocorreu um erro ao salvar a observação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSelectTransaction = (transactionId: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (selected) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(currentTransactions?.map(t => t.id) || []);
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleBulkCategorize = async (category: string) => {
    const selectedIds = Array.from(selectedTransactions);
    if (selectedIds.length === 0) return;

    try {
      const updates = selectedIds.map(id => {
        const obs = observations[id];
        const base: { id: string; category: string; status: string; observacao?: string } = {
          id,
          category,
          status: 'categorizado',
        };
        if (obs !== undefined && String(obs).trim() !== '') {
          base.observacao = String(obs).trim();
        }
        return base;
      });

      await bulkUpdateTransactions.mutateAsync(updates);

      toast({
        title: "Transações Categorizadas",
        description: `${selectedIds.length} transação${selectedIds.length > 1 ? 'ões foram categorizadas' : ' foi categorizada'} com sucesso.`,
      });

      setSelectedTransactions(new Set());
      setObservations(prev => {
        const next = { ...prev };
        selectedIds.forEach(id => { delete next[id]; });
        return next;
      });
      refetch();
    } catch (error) {
      console.error('Erro ao categorizar transações em massa:', error);
      toast({
        title: "Erro ao Categorizar",
        description: "Ocorreu um erro ao categorizar as transações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleObservationChange = (transactionId: string, value: string) => {
    setObservations(prev => ({ ...prev, [transactionId]: value }));
  };

  const handleClearSelection = () => {
    setSelectedTransactions(new Set());
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = new Set(filteredTransactions?.map(t => t.id) || []);
    setSelectedTransactions(allFilteredIds);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Categorização de Transações</h1>
          <p className="text-muted-foreground">
            Visualize e categorize as transações para gerar relatórios precisos
          </p>
        </div>
      </div>

      {/* Filters */}
        <CategoryFilters
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          dateRange={dateRange}
          setDateRange={setDateRange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchType={searchType}
          setSearchType={setSearchType}
          showOnlyUncategorized={showOnlyUncategorized}
          setShowOnlyUncategorized={setShowOnlyUncategorized}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          categories={categories}
        />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedTransactions.size}
        categories={categories}
        onBulkCategorize={handleBulkCategorize}
        onClearSelection={handleClearSelection}
        filteredCount={filteredTransactions?.length || 0}
        onSelectAllFiltered={handleSelectAllFiltered}
      />

      {/* Transactions Table */}
      <TransactionTable
        transactions={currentTransactions}
        categories={categories}
        onCategorize={handleCategorize}
        onRefresh={refetch}
        selectedTransactions={selectedTransactions}
        onSelectTransaction={handleSelectTransaction}
        onSelectAll={handleSelectAll}
        observations={observations}
        onObservationChange={handleObservationChange}
        onObservationUpdate={handleObservationUpdate}
      />

      {/* Pagination */}
      <TransactionPagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredTransactions?.length || 0}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Categorization;
