
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign
} from 'lucide-react';
import { AccountType, ACCOUNT_TYPES } from './ReportFilters';

interface CategoryData {
  id: string;
  name: string;
  type: 'entrada' | 'saida';
  total: number;
  transactionCount: number;
}

interface DRESectionsProps {
  entryCategories: CategoryData[];
  exitCategories: CategoryData[];
  totalEntries: number;
  totalExits: number;
  netResult: number;
  selectedAccount: AccountType;
}

export const DRESections = ({
  entryCategories,
  exitCategories,
  totalEntries,
  totalExits,
  netResult,
  selectedAccount
}: DRESectionsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getAccountBadge = (accountType: AccountType) => {
    const account = ACCOUNT_TYPES.find(type => type.value === accountType);
    const colors = {
      'ALL': 'bg-gray-100 text-gray-800',
      'BOLETOS': 'bg-blue-100 text-blue-800',
      'MENSALIDADES E TX ADM': 'bg-orange-100 text-orange-800',
      'APORTE E JOIA': 'bg-green-100 text-green-800',
      'Cora': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={`${colors[accountType]} text-sm px-3 py-1`}>
        {account?.label || accountType}
      </Badge>
    );
  };

  return (
    <>
      {/* DRE Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas (Entradas) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Receitas
              {selectedAccount !== 'ALL' && (
                <div className="ml-auto">
                  {getAccountBadge(selectedAccount)}
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Entradas por categoria no período (apenas com valores)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entryCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma categoria de entrada com valores encontrada no período
              </div>
            ) : (
              <div className="space-y-4">
                {entryCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {category.transactionCount} transações
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Média: {formatCurrency(category.transactionCount > 0 ? category.total / category.transactionCount : 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(category.total)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {totalEntries > 0 ? ((category.total / totalEntries) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t font-semibold">
                  <span>Total de Receitas</span>
                  <span className="text-green-600">{formatCurrency(totalEntries)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Despesas (Saídas) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Despesas
              {selectedAccount !== 'ALL' && (
                <div className="ml-auto">
                  {getAccountBadge(selectedAccount)}
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Saídas por categoria no período (apenas com valores)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exitCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma categoria de saída com valores encontrada no período
              </div>
            ) : (
              <div className="space-y-4">
                {exitCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {category.transactionCount} transações
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Média: {formatCurrency(category.transactionCount > 0 ? category.total / category.transactionCount : 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency(category.total)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {totalExits > 0 ? ((category.total / totalExits) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t font-semibold">
                  <span>Total de Despesas</span>
                  <span className="text-red-600">{formatCurrency(totalExits)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Result Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            Resultado do Período
            {selectedAccount !== 'ALL' && (
              <div className="ml-auto">
                {getAccountBadge(selectedAccount)}
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Demonstrativo consolidado do resultado (apenas categorias com valores)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span>Total de Receitas</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalEntries)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span>Total de Despesas</span>
              <span className="font-semibold text-red-600">({formatCurrency(totalExits)})</span>
            </div>
            <hr />
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Resultado Líquido</span>
              <span className={netResult >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(netResult)}
              </span>
            </div>
            <div className="text-center pt-4">
              <Badge 
                variant={netResult >= 0 ? "default" : "destructive"} 
                className="text-sm px-4 py-2"
              >
                {netResult >= 0 ? 'Resultado Positivo (Superávit)' : 'Resultado Negativo (Déficit)'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
