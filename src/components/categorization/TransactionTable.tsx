
import { Checkbox } from '@/components/ui/checkbox';
import TransactionRow from './TransactionRow';
import { Transaction } from '@/hooks/useSupabaseData';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Array<{ id: string; name: string; type: string }>;
  onCategorize: (transactionId: string, category: string, observation?: string) => void;
  onRefresh: () => void;
  selectedTransactions: Set<string>;
  onSelectTransaction: (transactionId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

const TransactionTable = ({ 
  transactions, 
  categories, 
  onCategorize, 
  onRefresh,
  selectedTransactions,
  onSelectTransaction,
  onSelectAll
}: TransactionTableProps) => {
  const allSelected = transactions.length > 0 && transactions.every(t => selectedTransactions.has(t.id));
  const someSelected = transactions.some(t => selectedTransactions.has(t.id));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                />
              </th>
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
            {transactions?.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories}
                onCategorize={onCategorize}
                onRefresh={onRefresh}
                isSelected={selectedTransactions.has(transaction.id)}
                onSelect={(selected) => onSelectTransaction(transaction.id, selected)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
