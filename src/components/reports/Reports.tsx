
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  FileText,
  Download
} from 'lucide-react';
import { useTransactions } from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';

const Reports = () => {
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const categorizedTransactions = transactions.filter(t => t.status === 'categorizado');
  
  // Calcular totais por categoria
  const categoryTotals = categories.map(category => {
    const categoryTransactions = categorizedTransactions.filter(t => t.category === category.name);
    const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      ...category,
      total,
      transactionCount: categoryTransactions.length,
      transactions: categoryTransactions
    };
  });

  const entryCategories = categoryTotals.filter(c => c.type === 'entrada');
  const exitCategories = categoryTotals.filter(c => c.type === 'saida');

  const totalEntries = entryCategories.reduce((sum, c) => sum + c.total, 0);
  const totalExits = exitCategories.reduce((sum, c) => sum + c.total, 0);
  const netResult = totalEntries - totalExits;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (transactionsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios DRE</h1>
          <p className="text-muted-foreground">
            Demonstrativo do Resultado do Exercício por categorias
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Summary Cards */}
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
              {entryCategories.reduce((sum, c) => sum + c.transactionCount, 0)} transações
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
              {exitCategories.reduce((sum, c) => sum + c.transactionCount, 0)} transações
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
              {categorizedTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {transactions.length} totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DRE Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas (Entradas) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Receitas
            </CardTitle>
            <CardDescription>
              Entradas por categoria no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entryCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma categoria de entrada encontrada
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
            </CardTitle>
            <CardDescription>
              Saídas por categoria no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exitCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma categoria de saída encontrada
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
          </CardTitle>
          <CardDescription>
            Demonstrativo consolidado do resultado
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
    </div>
  );
};

export default Reports;
