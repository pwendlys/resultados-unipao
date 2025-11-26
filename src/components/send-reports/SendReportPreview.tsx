import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  Calculator
} from 'lucide-react';
import { SendReportConfig } from './SendReports';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SendReportData {
  filteredTransactions: any[];
  categorizedTransactions: any[];
  entryTransactions: any[];
  exitTransactions: any[];
  totalEntries: number;
  totalExits: number;
  netResult: number;
}

interface SendReportPreviewProps {
  config: SendReportConfig;
  data: SendReportData;
  categories: any[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const SendReportPreview = ({ config, data, categories }: SendReportPreviewProps) => {
  // Calcular totais de juros
  const totalInterestEntries = data.entryTransactions.reduce((sum, t) => sum + (Number(t.juros) || 0), 0);
  const totalInterestExits = data.exitTransactions.reduce((sum, t) => sum + (Number(t.juros) || 0), 0);
  const totalInterest = totalInterestEntries + totalInterestExits;

  // Calcular categorias por tipo
  const getCategoriesByType = (type: 'entrada' | 'saida') => {
    const categoryTotals = data.categorizedTransactions
      .filter(t => t.type === type)
      .reduce((acc, transaction) => {
        const category = transaction.category || 'Sem Categoria';
        if (!acc[category]) {
          acc[category] = {
            name: category,
            type: transaction.type,
            total: 0,
            count: 0,
            totalInterest: 0
          };
        }
        acc[category].total += Number(transaction.amount);
        acc[category].totalInterest += Number(transaction.juros) || 0;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, any>);

    return Object.values(categoryTotals).sort((a: any, b: any) => b.total - a.total);
  };

  const entryCategories = getCategoriesByType('entrada');
  const exitCategories = getCategoriesByType('saida');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start gap-2 text-base sm:text-lg flex-wrap">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
          <span className="break-words">Preview: {config.reportTitle}</span>
        </CardTitle>
        <CardDescription>
          Visualização dos dados que serão enviados ao cooperado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Relatório */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-2 sm:p-0">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Período</div>
            <div className="font-medium text-xs sm:text-sm break-words">
              {config.dateFrom && config.dateTo 
                ? `${format(config.dateFrom, 'dd/MM/yyyy')} até ${format(config.dateTo, 'dd/MM/yyyy')}`
                : config.dateFrom 
                ? `A partir de ${format(config.dateFrom, 'dd/MM/yyyy')}`
                : config.dateTo 
                ? `Até ${format(config.dateTo, 'dd/MM/yyyy')}`
                : 'Todos os períodos'
              }
            </div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Contas</div>
            <div className={cn(
              "font-medium text-xs sm:text-sm break-words",
              config.selectedAccounts.length > 0 ? "text-orange-600" : "text-blue-600"
            )}>
              {config.selectedAccounts.length > 0 
                ? `🔍 ${config.selectedAccounts.length} conta(s)`
                : '✅ Todas'}
            </div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Transações</div>
            <div className="font-medium text-xs sm:text-sm">
              {data.categorizedTransactions.length} categorizadas
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {config.includeEntries && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Receitas</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 break-words">
                      {formatCurrency(data.totalEntries)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {data.entryTransactions.length} transações
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )}

          {config.includeExits && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Despesas</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600 break-words">
                      {formatCurrency(data.totalExits)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {data.exitTransactions.length} transações
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )}

          {config.includeEntries && config.includeExits && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Resultado</p>
                    <p className={`text-lg sm:text-2xl font-bold break-words ${data.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.netResult)}
                    </p>
                    <Badge variant={data.netResult >= 0 ? 'default' : 'destructive'} className="text-[10px] sm:text-xs">
                      {data.netResult >= 0 ? 'Superávit' : 'Déficit'}
                    </Badge>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )}

          {totalInterest > 0 && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Juros</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600 break-words">
                      {formatCurrency(totalInterest)}
                    </p>
                  </div>
                  <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                  <p className="text-lg sm:text-2xl font-bold break-words">
                    {data.filteredTransactions.length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">transações</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categorias */}
        {data.categorizedTransactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {config.includeEntries && entryCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg text-green-600">
                    Receitas por Categoria ({entryCategories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {entryCategories.map((category: any, index) => (
                        <div key={index} className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm break-words">{category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.count} transações
                              {data.totalEntries > 0 && ` • ${((category.total / data.totalEntries) * 100).toFixed(1)}%`}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-sm text-green-600 whitespace-nowrap">
                              {formatCurrency(category.total)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {config.includeExits && exitCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg text-red-600">
                    Despesas por Categoria ({exitCategories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {exitCategories.map((category: any, index) => (
                        <div key={index} className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm break-words">{category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.count} transações
                              {data.totalExits > 0 && ` • ${((category.total / data.totalExits) * 100).toFixed(1)}%`}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-sm text-red-600 whitespace-nowrap">
                              {formatCurrency(category.total)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SendReportPreview;
