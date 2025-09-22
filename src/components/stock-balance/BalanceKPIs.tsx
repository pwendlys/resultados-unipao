import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/stockBalanceProcessor';
import type { BalancoEstoque } from '@/hooks/useStockBalance';

interface BalanceKPIsProps {
  balanco: BalancoEstoque;
}

const BalanceKPIs = ({ balanco }: BalanceKPIsProps) => {
  const getResultadoStatus = () => {
    if (balanco.resultado_monetario > 0) return 'superavit';
    if (balanco.resultado_monetario < 0) return 'deficit';
    return 'neutro';
  };

  const getResultadoLabel = () => {
    const status = getResultadoStatus();
    switch (status) {
      case 'superavit': return 'Superávit Monetário';
      case 'deficit': return 'Déficit Monetário';
      default: return 'Balanço Monetário Neutro';
    }
  };

  const getResultadoColor = () => {
    const status = getResultadoStatus();
    switch (status) {
      case 'superavit': return 'text-green-600';
      case 'deficit': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Itens em Déficit</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{balanco.itens_negativos}</div>
          <p className="text-xs text-muted-foreground">
            Quantidade real menor que sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Itens em Superávit</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{balanco.itens_positivos}</div>
          <p className="text-xs text-muted-foreground">
            Quantidade real maior que sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Itens Neutros</CardTitle>
          <Minus className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{balanco.itens_neutros}</div>
          <p className="text-xs text-muted-foreground">
            Quantidades conferem
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado do Balanço</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getResultadoColor()}`}>
            {formatCurrency(balanco.resultado_monetario)}
          </div>
          <p className="text-xs text-muted-foreground">
            {getResultadoLabel()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceKPIs;