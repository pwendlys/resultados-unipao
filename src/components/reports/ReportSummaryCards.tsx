
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  FileText
} from 'lucide-react';

interface ReportSummaryCardsProps {
  totalEntries: number;
  totalExits: number;
  netResult: number;
  categorizedTransactionsCount: number;
  filteredTransactionsCount: number;
  entryTransactionsCount: number;
  exitTransactionsCount: number;
}

export const ReportSummaryCards = ({
  totalEntries,
  totalExits,
  netResult,
  categorizedTransactionsCount,
  filteredTransactionsCount,
  entryTransactionsCount,
  exitTransactionsCount
}: ReportSummaryCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalEntries)}
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
            {formatCurrency(totalExits)}
          </div>
          <p className="text-xs text-muted-foreground">
            {exitTransactionsCount} transações
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
            {formatCurrency(netResult)}
          </div>
          <p className="text-xs text-muted-foreground">
            {netResult >= 0 ? 'Superávit' : 'Déficit'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transações Categorizadas</CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {categorizedTransactionsCount}
          </div>
          <p className="text-xs text-muted-foreground">
            de {filteredTransactionsCount} no período
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
