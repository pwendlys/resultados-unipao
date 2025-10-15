import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import DataForm from './DataForm';
import SummaryCards from './SummaryCards';
import Charts from './Charts';
import DataTable from './DataTable';
import { useAssetsLiabilities } from '@/hooks/useAssetsLiabilities';
import { generateAssetsLiabilitiesPDF } from '@/utils/assetsLiabilitiesPdfGenerator';
import { useToast } from '@/hooks/use-toast';

export default function AssetsLiabilities() {
  const [showForm, setShowForm] = useState(false);
  const { data: records, isLoading } = useAssetsLiabilities();
  const { toast } = useToast();
  const chartsRef = useRef<HTMLDivElement>(null);

  const handleGeneratePDF = async () => {
    if (!records || records.length === 0) {
      toast({
        title: "Nenhum dado disponível",
        description: "Adicione pelo menos um registro antes de gerar o PDF.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Gerando PDF...",
        description: "Por favor, aguarde enquanto capturamos os gráficos."
      });

      // Buscar elementos dos gráficos
      const chartElements = chartsRef.current?.querySelectorAll('[data-chart-capture]') || [];
      
      await generateAssetsLiabilitiesPDF(records, Array.from(chartElements) as HTMLElement[]);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado automaticamente."
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o arquivo PDF.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ativos e Passivos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e acompanhe seus ativos e passivos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
          <Button onClick={handleGeneratePDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      )}

      {/* Tabs */}
      {!isLoading && (
        <Tabs defaultValue="visao-geral" className="w-full">
          <TabsList>
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="mt-6">
            <SummaryCards data={records?.[0]} />
          </TabsContent>

          <TabsContent value="graficos" className="mt-6">
            <div ref={chartsRef}>
              <Charts data={records} />
            </div>
          </TabsContent>

          <TabsContent value="historico" className="mt-6">
            <DataTable data={records} />
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <DataForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
