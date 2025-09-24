import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BalanceKPIs from './BalanceKPIs';
import BalanceCharts from './BalanceCharts';
import BalanceTable from './BalanceTable';
import BalanceReports from './BalanceReports';
import BalanceDropdown from './BalanceDropdown';
import { useItensBalanco, type BalancoEstoque } from '@/hooks/useStockBalance';

interface BalanceAnalysisProps {
  balanco: BalancoEstoque;
  balances: BalancoEstoque[];
  onBalanceChange: (balance: BalancoEstoque) => void;
}

const BalanceAnalysis = ({ balanco, balances, onBalanceChange }: BalanceAnalysisProps) => {
  const { data: itens = [], isLoading } = useItensBalanco(balanco.id);
  const [activeView, setActiveView] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do balanço...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Análise de Balanço</h2>
        
        {balances.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Selecionar Balanço:
            </label>
            <BalanceDropdown 
              balances={balances}
              selectedBalance={balanco}
              onSelect={onBalanceChange}
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Arquivo: {balanco.nome}</span>
          <span>Período: {balanco.periodo}</span>
          <span>Total de Itens: {balanco.total_itens}</span>
        </div>
      </div>

      <BalanceKPIs balanco={balanco} />

      <Card className="p-6">
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="table">Tabela Detalhada</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <BalanceCharts itens={itens} />
          </TabsContent>
          
          <TabsContent value="table" className="mt-6">
            <BalanceTable itens={itens} />
          </TabsContent>
          
          <TabsContent value="reports" className="mt-6">
            <BalanceReports itens={itens} balanco={balanco} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default BalanceAnalysis;