import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useSharedReport } from '@/hooks/useSharedReports';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const SharedCustomReport = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { data: reportData, isLoading, error } = useSharedReport(reportId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-4">Relatório Não Encontrado</h1>
          <p className="text-muted-foreground mb-4">
            O relatório solicitado não foi encontrado ou pode ter sido desativado.
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com a administração da Unipão para obter um novo link de acesso.
          </p>
        </div>
      </div>
    );
  }

  const { config, data } = reportData;

  // Calcular categorias por tipo
  const getCategoriesByType = (type: 'entrada' | 'saida') => {
    const categoryTotals = data.categorizedTransactions
      .filter((t: any) => t.type === type)
      .reduce((acc: any, transaction: any) => {
        const category = transaction.category || 'Sem Categoria';
        if (!acc[category]) {
          acc[category] = {
            name: category,
            type: transaction.type,
            total: 0,
            count: 0
          };
        }
        acc[category].total += Number(transaction.amount);
        acc[category].count += 1;
        return acc;
      }, {});

    return Object.values(categoryTotals).sort((a: any, b: any) => b.total - a.total);
  };

  const entryCategories = getCategoriesByType('entrada');
  const exitCategories = getCategoriesByType('saida');

  return (
    <div className="min-h-screen bg-background">
      {/* Header específico para visualização compartilhada */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Unipão</h1>
              <p className="text-sm text-muted-foreground">Relatório Personalizado - Somente Leitura</p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              Acesso Cooperado
            </div>
          </div>
        </div>
      </header>
      
      {/* Conteúdo do relatório */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Título e Informações do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {reportData.title}
              </CardTitle>
              <CardDescription>
                Gerado em: {format(new Date(reportData.created_at), 'dd/MM/yyyy \'às\' HH:mm')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Período</div>
                  <div className="font-medium">
                    {config.dateFrom && config.dateTo 
                      ? `${format(new Date(config.dateFrom), 'dd/MM/yyyy')} até ${format(new Date(config.dateTo), 'dd/MM/yyyy')}`
                      : config.dateFrom 
                      ? `A partir de ${format(new Date(config.dateFrom), 'dd/MM/yyyy')}`
                      : config.dateTo 
                      ? `Até ${format(new Date(config.dateTo), 'dd/MM/yyyy')}`
                      : 'Todos os períodos'
                    }
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Contas</div>
                  <div className="font-medium">
                    {config.selectedAccounts.length === 0 ? 'Todas as contas' : `${config.selectedAccounts.length} conta(s)`}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Transações</div>
                  <div className="font-medium">{data.categorizedTransactions.length} categorizadas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {config.includeEntries && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Receitas</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalEntries)}</p>
                      <p className="text-xs text-muted-foreground">{data.entryTransactions.length} transações</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            )}

            {config.includeExits && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Despesas</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExits)}</p>
                      <p className="text-xs text-muted-foreground">{data.exitTransactions.length} transações</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            )}

            {config.includeEntries && config.includeExits && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Resultado Líquido</p>
                      <p className={`text-2xl font-bold ${data.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.netResult)}
                      </p>
                      <Badge variant={data.netResult >= 0 ? 'default' : 'destructive'}>
                        {data.netResult >= 0 ? 'Superávit' : 'Déficit'}
                      </Badge>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Transações</p>
                    <p className="text-2xl font-bold">{data.filteredTransactions.length}</p>
                    <p className="text-xs text-muted-foreground">{data.categorizedTransactions.length} categorizadas</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análise por Categorias */}
          {data.categorizedTransactions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {config.includeEntries && entryCategories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">Receitas por Categoria</CardTitle>
                    <CardDescription>Distribuição das receitas pelas principais categorias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {entryCategories.map((category: any, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-green-900">{category.name}</div>
                            <div className="text-sm text-green-700">
                              {category.count} transações
                              {data.totalEntries > 0 && ` • ${((category.total / data.totalEntries) * 100).toFixed(1)}%`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{formatCurrency(category.total)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {config.includeExits && exitCategories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Despesas por Categoria</CardTitle>
                    <CardDescription>Distribuição das despesas pelas principais categorias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {exitCategories.map((category: any, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-red-900">{category.name}</div>
                            <div className="text-sm text-red-700">
                              {category.count} transações
                              {data.totalExits > 0 && ` • ${((category.total / data.totalExits) * 100).toFixed(1)}%`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">{formatCurrency(category.total)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Unipão - Relatório personalizado compartilhado para cooperados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SharedCustomReport;
