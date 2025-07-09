import { useState, useEffect } from 'react';
import { useTransactionsByAccount } from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';
import { useTransactionsActions } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, X, Copy, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addDays, format as dateFnsFormat } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TransactionRow from './TransactionRow';
import { DateRange } from 'react-day-picker';

const Categorization = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { data: transactions = [], isLoading, refetch } = useTransactionsByAccount(selectedAccount);
  const { data: categories = [] } = useCategories();
  const { updateTransaction } = useTransactionsActions();
  const { toast } = useToast();

  // Filter transactions based on search term and date range
  const filteredTransactions = transactions?.filter(transaction => {
    const searchTermLower = searchTerm.toLowerCase();
    const descriptionLower = transaction.description.toLowerCase();

    const matchesSearchTerm = descriptionLower.includes(searchTermLower);

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

    const matchesDateRange = !dateRange?.from || !dateRange?.to || (
      transactionDateOnly >= dateRange.from && transactionDateOnly <= dateRange.to
    );

    return matchesSearchTerm && matchesDateRange;
  });

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Account Type Filter */}
        <div>
          <Label htmlFor="accountType">Tipo de Conta</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as Contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Contas</SelectItem>
              <SelectItem value="BOLETOS">Boletos</SelectItem>
              <SelectItem value="MENSALIDADES E TX ADM">Mensalidades e Taxas Adm</SelectItem>
              <SelectItem value="APORTE E JOIA">Aporte e Joia</SelectItem>
              <SelectItem value="Cora">Cora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div>
          <Label>Período</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange?.from || !dateRange.to ? "text-muted-foreground" : undefined
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to ? (
                  <>
                    {dateFnsFormat(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {dateFnsFormat(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  <span>Selecionar Período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Filter */}
        <div>
          <Label htmlFor="search">Pesquisar Descrição</Label>
          <Input
            type="search"
            id="search"
            placeholder="Pesquisar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Juros
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observação
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTransactions?.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  categories={categories}
                  onCategorize={handleCategorize}
                  onRefresh={refetch}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Próximo
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> até <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTransactions?.length || 0)}</span> de <span className="font-medium">{filteredTransactions?.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  variant="outline"
                >
                  Anterior
                </Button>
                {/* Current: "z-10 bg-indigo-50 border-indigo-500 text-indigo-600", Default: "bg-white border-gray-300 text-gray-500 hover:bg-gray-50" */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-current="page"
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                      currentPage === page
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    )}
                    variant="outline"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  variant="outline"
                >
                  Próximo
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categorization;
