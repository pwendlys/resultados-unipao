import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import UploadBalance from './UploadBalance';
import BalanceAnalysis from './BalanceAnalysis';
import { useBalancosEstoque } from '@/hooks/useStockBalance';

const StockBalance = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const { data: balancos } = useBalancosEstoque();
  const latestBalanco = balancos?.[0];

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Balanço</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!latestBalanco}>
              Balanço Personalizado
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <UploadBalance onSuccess={() => setActiveTab('analysis')} />
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-6">
            {latestBalanco ? (
              <BalanceAnalysis balanco={latestBalanco} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum balanço encontrado. Faça o upload de um arquivo primeiro.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default StockBalance;