
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  FileText,
  BarChart3
} from 'lucide-react';
import { CustomReportConfig } from './CustomReports';
import { Category } from '@/hooks/useCategories';
import { format } from 'date-fns';

interface ReportPreviewData {
  filteredTransactions: any[];
  categorizedTransactions: any[];
  entryTransactions: any[];
  exitTransactions: any[];
  totalEntries: number;
  totalExits: number;
  netResult: number;
}

interface ReportPreviewProps {
  config: CustomReportConfig;
  data: ReportPreviewData;
  categories: Category[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const ReportPreview = ({ config, data, categories }: ReportPreviewProps) => {
  const getCategoryTotals = (type: 'entrada' | 'saida') => {
    const transactions = type === 'entrada' ? data.entryTransactions : data.exitTransactions;
    const categoryTotals = categories
      .filter(c => c.type === type)
      .map(category => {
        const categoryTransactions = transactions.filter(t => t.category === category.name);
        const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          ...category,
          total,
          transactionCount: categoryTransactions.length
        };
      })
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total);

    return categoryTotals;
  };

  const entryCategories = getCategoryTotals('entrada');
  const exitCategories = getCategoryTotals('saida');

  const getPeriodText = () => {
    if (!config.dateFrom && !config.dateTo) return 'Todos os períodos';
    if (config.dateFrom && config.dateTo) {
      return `${format(config.dateFrom, 'dd/MM/yyyy')} até ${format(config.dateTo, 'dd/MM/yyyy')}`;
    }
    if (config.dateFrom) {
      return `A partir de ${format(config.dateFrom, 'dd/MM/yyyy')}`;
    }
    if (config.dateTo) {
      return `Até ${format(config.dateTo, 'dd/MM/yyyy')}`;
    }
    return 'Todos os períodos';
  };

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Preview do Relatório: {config.reportTitle}
          </CardTitle>
          <CardDescription>
            Visualização prévia dos dados que serão incluídos no relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Período</p>
              <p className="font-medium">{getPeriodText()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Contas Selecionadas</p>
              <p className="font-medium">
                {config.selectedAccounts.length === 0 ? 'Todas as contas' : `${config.selectedAccounts.length} conta(s)`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Transações</p>
              <p className="font-medium">{data.categorizedTransactions.length} categorizadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Receitas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalEntries)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {data.entryTransactions.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExits)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {data.exitTransactions.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resultado Líquido</p>
                <p className={`text-2xl font-bold ${data.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netResult)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${data.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {data.netResult >= 0 ? 'Superávit' : 'Déficit'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Transações</p>
                <p className="text-2xl font-bold">{data.filteredTransactions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {data.categorizedTransactions.length} categorizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entry Categories */}
        {entryCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Receitas por Categoria</CardTitle>
              <CardDescription>
                Distribuição das receitas pelas principais categorias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entryCategories.slice(0, 5).map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.transactionCount} transações
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(category.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {((category.total / data.totalEntries) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                {entryCategories.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{entryCategories.length - 5} categorias adicionais no relatório completo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exit Categories */}
        {exitCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Despesas por Categoria</CardTitle>
              <CardDescription>
                Distribuição das despesas pelas principais categorias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exitCategories.slice(0, 5).map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.transactionCount} transações
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrency(category.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {((category.total / data.totalExits) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                {exitCategories.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{exitCategories.length - 5} categorias adicionais no relatório completo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Applied Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros Aplicados</CardTitle>
          <CardDescription>
            Resumo dos critérios que serão aplicados no relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {config.selectedAccounts.length > 0 ? (
              config.selectedAccounts.map(account => (
                <Badge key={account} variant="secondary">
                  Conta: {account}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">Todas as contas</Badge>
            )}
            
            {config.includeEntries && (
              <Badge variant="secondary" className="text-green-600">
                Incluir Entradas
              </Badge>
            )}
            
            {config.includeExits && (
              <Badge variant="secondary" className="text-red-600">
                Incluir Saídas
              </Badge>
            )}
            
            {config.selectedCategories.length > 0 && (
              <Badge variant="secondary">
                {config.selectedCategories.length} categoria(s) específica(s)
              </Badge>
            )}
            
            {(config.dateFrom || config.dateTo) && (
              <Badge variant="secondary">
                Período personalizado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
