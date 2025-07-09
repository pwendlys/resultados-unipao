
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  categories: Array<{ id: string; name: string; type: string }>;
  onBulkCategorize: (category: string) => void;
  onClearSelection: () => void;
}

const BulkActionsBar = ({
  selectedCount,
  categories,
  onBulkCategorize,
  onClearSelection
}: BulkActionsBarProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleBulkCategorize = () => {
    if (selectedCategory) {
      onBulkCategorize(selectedCategory);
      setSelectedCategory('');
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} transação{selectedCount > 1 ? 'ões' : ''} selecionada{selectedCount > 1 ? 's' : ''}
          </Badge>
          
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecionar categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleBulkCategorize}
              disabled={!selectedCategory}
              size="sm"
            >
              Categorizar Selecionadas
            </Button>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4 mr-1" />
          Limpar Seleção
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
