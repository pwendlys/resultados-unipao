
import { useState } from 'react';
import { Transaction } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { format } from 'date-fns';
import AddInterestButton from '@/components/transactions/AddInterestButton';

interface TransactionRowProps {
  transaction: Transaction;
  categories: Array<{ id: string; name: string; type: string }>;
  onCategorize: (transactionId: string, category: string, observation?: string) => void;
  onRefresh: () => void;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

const TransactionRow = ({ 
  transaction, 
  categories, 
  onCategorize, 
  onRefresh, 
  isSelected, 
  onSelect 
}: TransactionRowProps) => {
  const [selectedCategory, setSelectedCategory] = useState(transaction.category || '');
  const [observation, setObservation] = useState(transaction.observacao || '');

  const handleCategorize = () => {
    if (selectedCategory) {
      onCategorize(transaction.id, selectedCategory, observation);
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${day}/${month}/${year}`;
      } else {
        return format(new Date(dateString), 'dd/MM/yyyy');
      }
    } catch (error) {
      return dateString;
    }
  };

  // Filtrar categorias por tipo de transação
  const filteredCategories = categories.filter(cat => cat.type === transaction.type);

  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </td>
      <td className="px-4 py-3 text-sm">
        {formatDate(transaction.date)}
      </td>
      <td className="px-4 py-3 text-sm">
        {transaction.description}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        <span className={transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'}>
          {transaction.type === 'entrada' ? '+' : '-'} R$ {Number(transaction.amount).toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {transaction.juros > 0 ? (
          <span className="text-orange-600">
            R$ {Number(transaction.juros).toFixed(2)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        <Badge variant={transaction.type === 'entrada' ? 'default' : 'destructive'}>
          {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex gap-2">
          <AddInterestButton
            transactionId={transaction.id}
            currentInterest={transaction.juros || 0}
            onInterestAdded={onRefresh}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {transaction.status === 'categorizado' ? (
          <Badge variant="default">{transaction.category}</Badge>
        ) : (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        {transaction.status === 'categorizado' ? (
          <span className="text-gray-600">{transaction.observacao || '-'}</span>
        ) : (
          <Input
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Observação (opcional)"
            className="w-full"
          />
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        {transaction.status === 'categorizado' ? (
          <Badge variant="default">Categorizado</Badge>
        ) : (
          <Button
            onClick={handleCategorize}
            disabled={!selectedCategory}
            size="sm"
            className="h-8"
          >
            <Check className="h-3 w-3 mr-1" />
            Categorizar
          </Button>
        )}
      </td>
    </tr>
  );
};

export default TransactionRow;
