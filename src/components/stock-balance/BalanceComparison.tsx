import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BalancoEstoque, useItensBalanco } from '@/hooks/useStockBalance';
import { useBalanceComparison } from '@/hooks/useBalanceComparison';
import ComparisonKPIs from './ComparisonKPIs';
import ComparisonCharts from './ComparisonCharts';
import ComparisonTable from './ComparisonTable';
import ComparisonReports from './ComparisonReports';

interface BalanceComparisonProps {
  selectedBalances: BalancoEstoque[];
  onBack: () => void;
}

const BalanceComparison = ({ selectedBalances, onBack }: BalanceComparisonProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Buscar itens de todos os balanços selecionados
  const balanceQueries = selectedBalances.map(balance => 
    useItensBalanco(balance.id)
  );

  const isLoading = balanceQueries.some(query => query.isLoading);
  const hasError = balanceQueries.some(query => query.error);

  // Criar mapa de itens por balanço
  const allItems = selectedBalances.reduce((acc, balance, index) => {
    acc[balance.id] = balanceQueries[index].data || [];
    return acc;
  }, {} as { [balancoId: string]: any[] });

  // Usar hook de comparação
  const comparisonData = useBalanceComparison(selectedBalances, allItems);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados para comparação...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Erro ao carregar dados dos balanços.</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Voltar à Seleção
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!comparisonData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Selecione pelo menos 2 balanços para fazer a comparação.
          </p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Voltar à Seleção
          </Button>
        </CardContent>
      </Card>
    );
  }

  const periodNames = comparisonData.balances.map(b => b.periodo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Comparação de Balanços
          </h2>
          <p className="text-muted-foreground">
            Análise comparativa entre {comparisonData.balances.length} períodos: {periodNames.join(' vs ')}
          </p>
        </div>
      </div>

      {/* Tabs de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Comparativa</CardTitle>
          <CardDescription>
            Compare dados e métricas entre os períodos selecionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="table">Tabela Detalhada</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <ComparisonKPIs 
                kpis={comparisonData.kpis} 
                periodNames={periodNames}
              />
            </TabsContent>
            
            <TabsContent value="charts" className="mt-6">
              <ComparisonCharts data={comparisonData} />
            </TabsContent>
            
            <TabsContent value="table" className="mt-6">
              <ComparisonTable data={comparisonData} />
            </TabsContent>
            
            <TabsContent value="reports" className="mt-6">
              <ComparisonReports data={comparisonData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceComparison;