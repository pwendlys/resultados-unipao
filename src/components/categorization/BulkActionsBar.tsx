
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
import { X, CheckCheck, Info } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  categories: Array<{ id: string; name: string; type: string }>;
  onBulkCategorize: (category: string) => void;
  onClearSelection: () => void;
  filteredCount?: number;
  onSelectAllFiltered?: () => void;
}

const BulkActionsBar = ({
  selectedCount,
  categories,
  onBulkCategorize,
  onClearSelection,
  filteredCount = 0,
  onSelectAllFiltered,
}: BulkActionsBarProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleBulkCategorize = () => {
    if (selectedCategory) {
      onBulkCategorize(selectedCategory);
      setSelectedCategory('');
    }
  };

  if (selectedCount === 0) return null;

  const canExpandSelection =
    !!onSelectAllFiltered &&
    filteredCount > selectedCount &&
    filteredCount > 0;

  const allFilteredSelected =
    filteredCount > 0 && selectedCount >= filteredCount;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
      {/* Faixa contextual: oferecer selecionar todas as filtradas */}
      {canExpandSelection && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-blue-200 rounded-md px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <Info className="h-4 w-4 text-blue-600" />
            <span>
              <strong>{selectedCount}</strong> selecionada{selectedCount > 1 ? 's' : ''} nesta página.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAllFiltered}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Selecionar todas as {filteredCount} transações filtradas
          </Button>
        </div>
      )}

      {allFilteredSelected && filteredCount > selectedCount === false && filteredCount > 0 && onSelectAllFiltered && (
        <div className="flex items-center gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <CheckCheck className="h-4 w-4 text-green-600" />
          <span>
            Todas as <strong>{filteredCount}</strong> transações filtradas estão selecionadas.
          </span>
        </div>
      )}

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
