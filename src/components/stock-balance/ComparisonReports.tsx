import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { ComparisonData } from '@/hooks/useBalanceComparison';
import { formatCurrency } from '@/utils/financialProcessor';

interface ComparisonReportsProps {
  data: ComparisonData;
}

const ComparisonReports = ({ data }: ComparisonReportsProps) => {
  const generateExecutiveSummary = () => {
    const firstPeriod = data.balances[0];
    const lastPeriod = data.balances[data.balances.length - 1];
    const variation = data.kpis.evolucao_resultado.variacao;
    const percentual = data.kpis.evolucao_resultado.variacao_percentual;
    
    const improvedItems = data.kpis.top_melhorias.length;
    const worsenedItems = data.kpis.top_pioras.length;
    const totalWithVariation = data.itemsComparison.filter(item => 
      Math.abs(item.variacao_monetaria || 0) > 1
    ).length;

    return `
RELATÓRIO EXECUTIVO - COMPARAÇÃO DE BALANÇOS
===========================================

PERÍODOS ANALISADOS:
- Inicial: ${firstPeriod.periodo} (${firstPeriod.nome})
- Final: ${lastPeriod.periodo} (${lastPeriod.nome})

RESUMO EXECUTIVO:
${variation >= 0 ? '❌' : '✅'} Resultado monetário ${variation >= 0 ? 'piorou' : 'melhorou'} em ${formatCurrency(Math.abs(variation))} (${Math.abs(percentual).toFixed(1)}%)
${data.kpis.evolucao_itens.negativos.variacao <= 0 ? '✅' : '❌'} Itens em déficit: ${data.kpis.evolucao_itens.negativos.variacao <= 0 ? 'diminuíram' : 'aumentaram'} ${Math.abs(data.kpis.evolucao_itens.negativos.variacao)} itens
${data.kpis.evolucao_itens.positivos.variacao >= 0 ? '✅' : '❌'} Itens com superávit: ${data.kpis.evolucao_itens.positivos.variacao >= 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(data.kpis.evolucao_itens.positivos.variacao)} itens

INDICADORES PRINCIPAIS:
- Total de itens com variação significativa: ${totalWithVariation}
- Itens que melhoraram: ${improvedItems}
- Itens que pioraram: ${worsenedItems}
- Taxa de melhoria: ${totalWithVariation > 0 ? ((improvedItems / totalWithVariation) * 100).toFixed(1) : 0}%

TOP 5 MAIORES MELHORIAS:
${data.kpis.top_melhorias.slice(0, 5).map((item, index) => 
  `${index + 1}. ${item.codigo || item.descricao || 'N/A'}: ${formatCurrency(item.variacao_monetaria || 0)}`
).join('\n')}

TOP 5 MAIORES PIORAS:
${data.kpis.top_pioras.slice(0, 5).map((item, index) => 
  `${index + 1}. ${item.codigo || item.descricao || 'N/A'}: ${formatCurrency(item.variacao_monetaria || 0)}`
).join('\n')}

RECOMENDAÇÕES:
${variation < 0 ? '- Manter as práticas que levaram à melhoria do resultado' : '- Investigar causas da piora no resultado monetário'}
${data.kpis.evolucao_itens.negativos.variacao > 0 ? '- Priorizar ações para reduzir itens em déficit' : '- Continuar estratégias de redução de déficit'}
- Focar nos itens com maior variação negativa para obter melhor impacto
- Analisar padrões sazonais que possam explicar as variações
`;
  };

  const downloadExecutiveSummary = () => {
    const content = generateExecutiveSummary();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_executivo_${data.balances[0].periodo}_vs_${data.balances[data.balances.length - 1].periodo}.txt`;
    link.click();
  };

  const downloadDetailedReport = () => {
    const headers = ['Código', 'Descrição', ...data.balances.map(b => `${b.periodo} (R$)`), 'Variação (R$)', 'Variação (%)', 'Tendência'];
    const rows = data.itemsComparison.map(item => [
      item.codigo || '',
      item.descricao || '',
      ...data.balances.map(b => (item.balances[b.id]?.diferenca_monetaria || 0).toFixed(2)),
      (item.variacao_monetaria || 0).toFixed(2),
      (item.variacao_percentual || 0).toFixed(1) + '%',
      item.trend === 'melhorou' ? 'Melhorou' : item.trend === 'piorou' ? 'Piorou' : 'Manteve'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_detalhado_${data.balances[0].periodo}_vs_${data.balances[data.balances.length - 1].periodo}.csv`;
    link.click();
  };

  const downloadActionPlan = () => {
    const criticalItems = data.kpis.top_pioras.slice(0, 10);
    const opportunityItems = data.kpis.top_melhorias.slice(0, 5);
    
    const content = `
PLANO DE AÇÃO - BALANÇO DE ESTOQUE
==================================

ITENS CRÍTICOS (NECESSITAM AÇÃO IMEDIATA):
${criticalItems.map((item, index) => `
${index + 1}. ITEM: ${item.codigo || item.descricao || 'N/A'}
   Impacto: ${formatCurrency(item.variacao_monetaria || 0)}
   Ação Sugerida: ${(item.variacao_monetaria || 0) > 0 ? 'Investigar aumento de falta/sobra no estoque' : 'Revisar processo de contagem'}
   Prioridade: ${index < 3 ? 'ALTA' : index < 7 ? 'MÉDIA' : 'BAIXA'}
   Responsável: [A DEFINIR]
   Prazo: [A DEFINIR]
`).join('\n')}

OPORTUNIDADES DE MELHORIA (CASOS DE SUCESSO):
${opportunityItems.map((item, index) => `
${index + 1}. ITEM: ${item.codigo || item.descricao || 'N/A'}
   Melhoria: ${formatCurrency(Math.abs(item.variacao_monetaria || 0))}
   Ação: Replicar boas práticas para outros itens similares
`).join('\n')}

METAS PARA PRÓXIMO PERÍODO:
- Reduzir itens em déficit em pelo menos 10%
- Melhorar resultado monetário em ${Math.abs(data.kpis.evolucao_resultado.variacao_percentual * 0.5).toFixed(1)}%
- Focar nos ${criticalItems.length} itens críticos listados acima
- Implementar contagem cíclica para itens de alta variação

CRONOGRAMA SUGERIDO:
Semana 1-2: Análise detalhada dos itens críticos
Semana 3-4: Implementação de melhorias nos processos
Semana 5-6: Acompanhamento e ajustes
Semana 7-8: Preparação para próxima contagem
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plano_acao_${data.balances[0].periodo}_vs_${data.balances[data.balances.length - 1].periodo}.txt`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumo Executivo
          </CardTitle>
          <CardDescription>
            Principais insights da comparação entre períodos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {data.kpis.evolucao_resultado.variacao >= 0 ? '+' : ''}
                {formatCurrency(data.kpis.evolucao_resultado.variacao)}
              </div>
              <div className="text-sm text-muted-foreground">Variação Resultado</div>
              <Badge variant={data.kpis.evolucao_resultado.variacao >= 0 ? 'destructive' : 'default'}>
                {Math.abs(data.kpis.evolucao_resultado.variacao_percentual).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.kpis.top_melhorias.length}
              </div>
              <div className="text-sm text-muted-foreground">Itens Melhoraram</div>
              <Badge variant="default">Oportunidades</Badge>
            </div>
            
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {data.kpis.top_pioras.length}
              </div>
              <div className="text-sm text-muted-foreground">Itens Pioraram</div>
              <Badge variant="destructive">Atenção Necessária</Badge>
            </div>
          </div>

          <Button onClick={downloadExecutiveSummary} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Baixar Resumo Executivo
          </Button>
        </CardContent>
      </Card>

      {/* Relatórios Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatório Detalhado
            </CardTitle>
            <CardDescription>
              Dados completos de todos os itens comparados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Inclui dados de {data.itemsComparison.length} itens com variações detalhadas entre os períodos.
            </p>
            <Button onClick={downloadDetailedReport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório Completo (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Plano de Ação
            </CardTitle>
            <CardDescription>
              Recomendações baseadas na análise comparativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Plano estruturado com ações prioritárias para melhorar o balanço de estoque.
            </p>
            <Button onClick={downloadActionPlan} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Baixar Plano de Ação
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Insights Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Principais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.kpis.evolucao_resultado.variacao < 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  <strong>Melhoria:</strong> O resultado monetário melhorou em {formatCurrency(Math.abs(data.kpis.evolucao_resultado.variacao))}, 
                  indicando melhor controle de estoque.
                </span>
              </div>
            )}
            
            {data.kpis.evolucao_itens.negativos.variacao < 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  <strong>Progresso:</strong> Redução de {Math.abs(data.kpis.evolucao_itens.negativos.variacao)} itens 
                  em déficit entre os períodos.
                </span>
              </div>
            )}
            
            {data.kpis.top_melhorias.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Oportunidade:</strong> {data.kpis.top_melhorias.length} itens apresentaram melhorias significativas. 
                  Analise as práticas aplicadas para replicar em outros itens.
                </span>
              </div>
            )}
            
            {data.kpis.top_pioras.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <FileText className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> {data.kpis.top_pioras.length} itens requerem ação imediata 
                  devido ao aumento significativo nas divergências.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonReports;