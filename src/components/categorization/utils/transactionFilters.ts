
import { Transaction } from '@/hooks/useSupabaseData';
import { DateRange } from 'react-day-picker';

export const filterTransactions = (
  transactions: Transaction[],
  searchTerm: string,
  dateRange: DateRange | undefined,
  showOnlyUncategorized: boolean = false
): Transaction[] => {
  return transactions?.filter(transaction => {
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

    const matchesUncategorizedFilter = !showOnlyUncategorized || transaction.status === 'pendente';

    return matchesSearchTerm && matchesDateRange && matchesUncategorizedFilter;
  });
};
