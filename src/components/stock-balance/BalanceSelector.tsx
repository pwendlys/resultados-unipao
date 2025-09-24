import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  const handleBalanceToggle = (balance: BalancoEstoque, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedBalances, balance]);
    } else {
      onSelectionChange(selectedBalances.filter(b => b.id !== balance.id));
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
            Escolha 2 ou mais balanços para análise comparativa
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
          
          return (
            <Card 
              key={balance.id} 
              className={`cursor-pointer transition-colors ${
                isSelected ? 'ring-2 ring-primary bg-accent/50' : 'hover:bg-accent/20'
              }`}
              onClick={() => handleBalanceToggle(balance, !isSelected)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{balance.nome}</CardTitle>
                    <CardDescription>{balance.periodo}</CardDescription>
                  </div>
                  <Checkbox 
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1"
                  />
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