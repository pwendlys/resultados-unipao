import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { ComparisonData } from '@/hooks/useBalanceComparison';
import { formatCurrency } from '@/utils/financialProcessor';

interface ReportPreviewProps {
  data: ComparisonData;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => Promise<void>;
}

const ReportPreview = ({ data, isOpen, onClose, onDownload }: ReportPreviewProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  const firstPeriod = data.balances[0];
  const lastPeriod = data.balances[data.balances.length - 1];
  const variacao = data.kpis.evolucao_resultado.variacao;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preview do Relatório Executivo
          </DialogTitle>
          <DialogDescription>
            Comparação entre {firstPeriod.periodo} e {lastPeriod.periodo}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="items">Itens Críticos</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="actions">Recomendações</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Variação do Resultado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(variacao)}
                  </div>
                  <Badge variant={variacao >= 0 ? 'destructive' : 'default'}>
                    {Math.abs(data.kpis.evolucao_resultado.variacao_percentual).toFixed(1)}%
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Itens Melhoraram</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {data.kpis.top_melhorias.length}
                  </div>
                  <Badge variant="default">Oportunidades</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Itens Pioraram</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {data.kpis.top_pioras.length}
                  </div>
                  <Badge variant="destructive">Requer Atenção</Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className={`p-3 rounded-lg ${variacao >= 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                    {variacao >= 0 ? (
                      <span className="text-red-800">
                        ⚠️ O resultado piorou em {formatCurrency(Math.abs(variacao))} ({Math.abs(data.kpis.evolucao_resultado.variacao_percentual).toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="text-green-800">
                        ✅ O resultado melhorou em {formatCurrency(Math.abs(variacao))} ({Math.abs(data.kpis.evolucao_resultado.variacao_percentual).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.kpis.top_melhorias.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Top 5 Melhorias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.kpis.top_melhorias.slice(0, 5).map((item, index) => (
                        <div key={index} className="border-l-4 border-green-500 pl-3">
                          <div className="font-medium text-sm">
                            {item.descricao || item.codigo || 'Item sem descrição'}
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            {formatCurrency(item.variacao_monetaria || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.kpis.top_pioras.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Top 5 Itens Críticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.kpis.top_pioras.slice(0, 5).map((item, index) => (
                        <div key={index} className="border-l-4 border-red-500 pl-3">
                          <div className="font-medium text-sm">
                            {item.descricao || item.codigo || 'Item sem descrição'}
                          </div>
                          <div className="text-sm text-red-600 font-medium">
                            {formatCurrency(item.variacao_monetaria || 0)}
                          </div>
                          <Badge 
                            variant={index < 3 ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {index < 3 ? 'Alta' : index < 7 ? 'Média' : 'Baixa'} Prioridade
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Gráficos Inclusos no Relatório
                  </CardTitle>
                  <CardDescription>
                    O PDF conterá gráficos visuais para facilitar a análise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="font-medium">Evolução do Resultado</div>
                      <div className="text-sm text-muted-foreground">Linha temporal</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <PieChart className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="font-medium">Distribuição de Itens</div>
                      <div className="text-sm text-muted-foreground">Por tendência</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="font-medium">Top Variações</div>
                      <div className="text-sm text-muted-foreground">Barras horizontais</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recomendações Estratégicas</CardTitle>
                <CardDescription>
                  Ações prioritárias baseadas na análise comparativa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Ações Prioritárias:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>{variacao < 0 ? 'Documentar e replicar práticas que levaram à melhoria' : 'Investigar e corrigir causas da deterioração'}</li>
                      <li>Focar nos {Math.min(data.kpis.top_pioras.length, 5)} itens críticos identificados</li>
                      <li>Implementar contagem cíclica para itens de alta variação</li>
                      <li>Revisar processos de entrada e saída de estoque</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Cronograma Sugerido:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Semana 1-2: Análise detalhada dos itens críticos</li>
                      <li>Semana 3-4: Implementação de melhorias nos processos</li>
                      <li>Semana 5-6: Treinamento da equipe e ajustes</li>
                      <li>Semana 7-8: Monitoramento e preparação para próxima contagem</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Metas para Próximo Período:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Reduzir número de itens em déficit em 15%</li>
                      <li>Melhorar resultado monetário em {Math.abs(data.kpis.evolucao_resultado.variacao_percentual * 0.3).toFixed(1)}%</li>
                      <li>Aumentar precisão do inventário para 95%</li>
                      <li>Implementar controle preventivo nos itens críticos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Fechar Preview
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Gerando PDF...' : 'Baixar Relatório Completo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreview;