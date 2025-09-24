import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import UploadBalance from './UploadBalance';
import BalanceAnalysis from './BalanceAnalysis';
import BalanceSelector from './BalanceSelector';
import BalanceComparison from './BalanceComparison';
import { useBalancosEstoque, BalancoEstoque } from '@/hooks/useStockBalance';

const StockBalance = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedBalances, setSelectedBalances] = useState<BalancoEstoque[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedBalanceForAnalysis, setSelectedBalanceForAnalysis] = useState<BalancoEstoque | null>(null);
  const { data: balancos } = useBalancosEstoque();
  const latestBalanco = balancos?.[0];
  const hasMultipleBalances = (balancos?.length || 0) >= 2;
  
  // Atualizar balanço selecionado quando dados carregarem
  if (latestBalanco && !selectedBalanceForAnalysis) {
    setSelectedBalanceForAnalysis(latestBalanco);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Balanço de Estoque</h1>
        <p className="text-muted-foreground">
          Gerencie e analise o balanço de estoque da sua empresa
        </p>
      </div>

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${hasMultipleBalances ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="upload">Upload Balanço</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!latestBalanco}>
              Balanço Personalizado
            </TabsTrigger>
            {hasMultipleBalances && (
              <TabsTrigger value="comparison">
                Comparação de Balanços
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <UploadBalance onSuccess={() => setActiveTab('analysis')} />
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-6">
            {selectedBalanceForAnalysis ? (
              <BalanceAnalysis 
                balanco={selectedBalanceForAnalysis} 
                balances={balancos || []}
                onBalanceChange={setSelectedBalanceForAnalysis}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum balanço encontrado. Faça o upload de um arquivo primeiro.
                </p>
              </div>
            )}
          </TabsContent>
          
          {hasMultipleBalances && (
            <TabsContent value="comparison" className="mt-6">
              {showComparison ? (
                <BalanceComparison 
                  selectedBalances={selectedBalances}
                  onBack={() => {
                    setShowComparison(false);
                    setSelectedBalances([]);
                  }}
                />
              ) : (
                <BalanceSelector
                  balances={balancos || []}
                  selectedBalances={selectedBalances}
                  onSelectionChange={setSelectedBalances}
                  onCompare={() => setShowComparison(true)}
                />
              )}
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default StockBalance;