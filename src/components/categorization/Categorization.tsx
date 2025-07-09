
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
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { data: transactions = [], isLoading, refetch } = useTransactionsByAccount(selectedAccount);
  const { data: categories = [] } = useCategories();
  const { updateTransaction, bulkUpdateTransactions } = useTransactionsActions();
  const { toast } = useToast();

  // Filter transactions based on search term, date range, and uncategorized filter
  const filteredTransactions = filterTransactions(transactions, searchTerm, dateRange, showOnlyUncategorized);

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
      const updates = selectedIds.map(id => ({
        id,
        category,
        status: 'categorizado'
      }));

      await bulkUpdateTransactions.mutateAsync(updates);

      toast({
        title: "Transações Categorizadas",
        description: `${selectedIds.length} transação${selectedIds.length > 1 ? 'ões foram categorizadas' : ' foi categorizada'} com sucesso.`,
      });

      setSelectedTransactions(new Set());
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

  const handleClearSelection = () => {
    setSelectedTransactions(new Set());
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
        showOnlyUncategorized={showOnlyUncategorized}
        setShowOnlyUncategorized={setShowOnlyUncategorized}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedTransactions.size}
        categories={categories}
        onBulkCategorize={handleBulkCategorize}
        onClearSelection={handleClearSelection}
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
