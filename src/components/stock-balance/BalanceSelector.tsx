import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BalancoEstoque } from '@/hooks/useStockBalance';
import { formatCurrency } from '@/utils/financialProcessor';

interface BalanceSelectorProps {
  balances: BalancoEstoque[];
  selectedBalances: BalancoEstoque[];
  onSelectionChange: (balances: BalancoEstoque[]) => void;
  onCompare: () => void;
}

const BalanceSelector = ({ 
  balances, 
  selectedBalances, 
  onSelectionChange, 
  onCompare 
}: BalanceSelectorProps) => {
  const handleBalanceClick = (balance: BalancoEstoque) => {
    const isSelected = selectedBalances.some(b => b.id === balance.id);
    
    if (isSelected) {
      // Remove da sequência e reorganiza
      onSelectionChange(selectedBalances.filter(b => b.id !== balance.id));
    } else {
      // Adiciona ao final da sequência
      onSelectionChange([...selectedBalances, balance]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const canCompare = selectedBalances.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Selecionar Balanços para Comparação</h2>
          <p className="text-sm text-muted-foreground">
            Clique nos balanços na ordem cronológica desejada para comparação
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedBalances.length > 0 && (
            <Badge variant="secondary">
              {selectedBalances.length} selecionado{selectedBalances.length > 1 ? 's' : ''}
            </Badge>
          )}
          {selectedBalances.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Limpar
            </Button>
          )}
          <Button 
            onClick={onCompare} 
            disabled={!canCompare}
            className="min-w-[120px]"
          >
            Comparar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.map((balance) => {
          const isSelected = selectedBalances.some(b => b.id === balance.id);
          const selectionIndex = selectedBalances.findIndex(b => b.id === balance.id);
          const selectionOrder = selectionIndex >= 0 ? selectionIndex + 1 : null;
          
          return (
            <Card 
              key={balance.id} 
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary bg-accent/50 shadow-md' : 'hover:bg-accent/20 hover:shadow-sm'
              }`}
              onClick={() => handleBalanceClick(balance)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{balance.nome}</CardTitle>
                      {selectionOrder && (
                        <Badge variant="default" className="text-xs font-bold px-2 py-1">
                          {selectionOrder}º
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{balance.periodo}</CardDescription>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">
                        {selectionOrder}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de Itens:</span>
                    <span className="font-medium">{balance.total_itens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resultado:</span>
                    <span className={`font-medium ${
                      (balance.resultado_monetario || 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(balance.resultado_monetario || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Criado em:</span>
                    <span>{new Date(balance.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {balances.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum balanço disponível para comparação.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BalanceSelector;