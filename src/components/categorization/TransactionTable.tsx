
import TransactionRow from './TransactionRow';
import { Transaction } from '@/hooks/useSupabaseData';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Array<{ id: string; name: string; type: string }>;
  onCategorize: (transactionId: string, category: string, observation?: string) => void;
  onRefresh: () => void;
}

const TransactionTable = ({ transactions, categories, onCategorize, onRefresh }: TransactionTableProps) => {
  return (
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
            {transactions?.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories}
                onCategorize={onCategorize}
                onRefresh={onRefresh}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
