
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calculator, DollarSign } from 'lucide-react';

interface ReportSummaryCardsProps {
  totalEntries: number;
  totalExits: number;
  totalInterest: number;
  netResult: number;
  categorizedTransactionsCount: number;
  filteredTransactionsCount: number;
  entryTransactionsCount: number;
  exitTransactionsCount: number;
}

export const ReportSummaryCards = ({
  totalEntries,
  totalExits,
  totalInterest,
  netResult,
  categorizedTransactionsCount,
  filteredTransactionsCount,
  entryTransactionsCount,
  exitTransactionsCount,
}: ReportSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {totalEntries.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {entryTransactionsCount} transações
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            R$ {totalExits.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {exitTransactionsCount} transações
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Juros</CardTitle>
          <Calculator className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            R$ {totalInterest.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Em {categorizedTransactionsCount} transações
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
          <DollarSign className={`h-4 w-4 ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {netResult.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {categorizedTransactionsCount} de {filteredTransactionsCount} categorizadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
