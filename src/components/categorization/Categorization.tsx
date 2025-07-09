
import { useState } from 'react';
import { useTransactionsByAccount } from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';
import { useTransactionsActions } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import CategoryFilters from './CategoryFilters';
import TransactionTable from './TransactionTable';
import TransactionPagination from './TransactionPagination';
import { filterTransactions } from './utils/transactionFilters';

const Categorization = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { data: transactions = [], isLoading, refetch } = useTransactionsByAccount(selectedAccount);
  const { data: categories = [] } = useCategories();
  const { updateTransaction } = useTransactionsActions();
  const { toast } = useToast();

  // Filter transactions based on search term and date range
  const filteredTransactions = filterTransactions(transactions, searchTerm, dateRange);

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
      />

      {/* Transactions Table */}
      <TransactionTable
        transactions={currentTransactions}
        categories={categories}
        onCategorize={handleCategorize}
        onRefresh={refetch}
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
