import jsPDF from 'jspdf';
import { ComparisonData } from '@/hooks/useBalanceComparison';
import { formatCurrency } from '@/utils/financialProcessor';

interface ChartData {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export const generateComparisonPDF = async (data: ComparisonData, charts?: ChartData[]) => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Função para adicionar nova página
  const addNewPage = () => {
    doc.addPage();
    yPosition = 20;
  };

  // Função para verificar quebra de página
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      addNewPage();
    }
  };

  // Função para adicionar gráfico
  const addChart = (canvas: HTMLCanvasElement, width: number, height: number) => {
    const imgData = canvas.toDataURL('image/png');
    const aspectRatio = canvas.height / canvas.width;
    const chartWidth = Math.min(width, pageWidth - 2 * margin);
    const chartHeight = chartWidth * aspectRatio;
    
    checkPageBreak(chartHeight + 10);
    doc.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
    yPosition += chartHeight + 10;
  };

  // ========== CAPA ==========
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO EXECUTIVO', pageWidth / 2, 60, { align: 'center' });
  doc.text('COMPARAÇÃO DE BALANÇOS', pageWidth / 2, 80, { align: 'center' });
  
  yPosition = 120;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  
  const firstPeriod = data.balances[0];
  const lastPeriod = data.balances[data.balances.length - 1];
  
  doc.text(`Período Inicial: ${firstPeriod.periodo}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  doc.text(`Período Final: ${lastPeriod.periodo}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 30;
  
  doc.setFontSize(12);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
  
  addNewPage();

  // ========== SUMÁRIO EXECUTIVO ==========
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('1. SUMÁRIO EXECUTIVO', margin, yPosition);
  yPosition += 20;

  // KPIs principais em cards visuais
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICADORES PRINCIPAIS', margin, yPosition);
  yPosition += 15;

  // Card 1: Resultado Monetário
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, yPosition, 80, 30, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('VARIAÇÃO RESULTADO', margin + 5, yPosition + 8);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const variacao = data.kpis.evolucao_resultado.variacao;
  doc.setTextColor(variacao >= 0 ? 220 : 34, variacao >= 0 ? 38 : 139, variacao >= 0 ? 38 : 34);
  doc.text(formatCurrency(variacao), margin + 5, yPosition + 20);
  doc.setTextColor(0, 0, 0);

  // Card 2: Itens Melhoraram
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin + 90, yPosition, 80, 30, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ITENS MELHORARAM', margin + 95, yPosition + 8);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34);
  doc.text(data.kpis.top_melhorias.length.toString(), margin + 95, yPosition + 20);
  doc.setTextColor(0, 0, 0);

  yPosition += 40;

  // Status geral
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const statusText = variacao >= 0 
    ? `⚠️ ATENÇÃO: O resultado piorou em ${formatCurrency(Math.abs(variacao))} (${Math.abs(data.kpis.evolucao_resultado.variacao_percentual).toFixed(1)}%)`
    : `✅ MELHORIA: O resultado melhorou em ${formatCurrency(Math.abs(variacao))} (${Math.abs(data.kpis.evolucao_resultado.variacao_percentual).toFixed(1)}%)`;
  
  doc.text(statusText, margin, yPosition);
  yPosition += 25;

  // ========== GRÁFICOS ==========
  if (charts && charts.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ANÁLISE VISUAL', margin, yPosition);
    yPosition += 15;

    charts.forEach((chart, index) => {
      addChart(chart.canvas, chart.width, chart.height);
    });
  }

  // ========== ANÁLISE DETALHADA DOS ITENS ==========
  addNewPage();
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('2. ANÁLISE DETALHADA DOS ITENS', margin, yPosition);
  yPosition += 20;

  // Top 10 Melhorias
  if (data.kpis.top_melhorias.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34);
    doc.text('🎯 TOP 10 MELHORIAS SIGNIFICATIVAS', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    data.kpis.top_melhorias.slice(0, 10).forEach((item, index) => {
      checkPageBreak(25);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${item.descricao || item.codigo || 'Item sem descrição'}`, margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Detalhes do item
      const firstBalance = data.balances[0];
      const lastBalance = data.balances[data.balances.length - 1];
      const firstValue = item.balances[firstBalance.id]?.diferenca_monetaria || 0;
      const lastValue = item.balances[lastBalance.id]?.diferenca_monetaria || 0;
      
      doc.text(`   • Impacto Financeiro: ${formatCurrency(item.variacao_monetaria || 0)} (melhoria)`, margin, yPosition);
      yPosition += 5;
      doc.text(`   • Situação Inicial: ${formatCurrency(firstValue)}`, margin, yPosition);
      yPosition += 5;
      doc.text(`   • Situação Final: ${formatCurrency(lastValue)}`, margin, yPosition);
      yPosition += 5;
      
      // Contexto da melhoria
      const quantidadeInicial = item.balances[firstBalance.id]?.diferenca_quantidade || 0;
      const quantidadeFinal = item.balances[lastBalance.id]?.diferenca_quantidade || 0;
      const variacaoQtd = quantidadeFinal - quantidadeInicial;
      
      if (Math.abs(variacaoQtd) > 0) {
        doc.text(`   • Variação em Quantidade: ${variacaoQtd > 0 ? '+' : ''}${variacaoQtd} unidades`, margin, yPosition);
        yPosition += 5;
      }
      
      // Recomendação específica
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(34, 139, 34);
      if (firstValue > 0 && lastValue < firstValue) {
        doc.text('   ✅ Recomendação: Replicar as práticas aplicadas para outros itens similares', margin, yPosition);
      } else if (firstValue < 0 && lastValue > firstValue) {
        doc.text('   ✅ Recomendação: Manter processo atual de controle de estoque', margin, yPosition);
      } else {
        doc.text('   ✅ Recomendação: Documentar processo para padronização', margin, yPosition);
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPosition += 12;
    });
  }

  // Top 10 Pioras
  if (data.kpis.top_pioras.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('⚠️ TOP 10 ITENS CRÍTICOS (REQUEREM AÇÃO)', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    data.kpis.top_pioras.slice(0, 10).forEach((item, index) => {
      checkPageBreak(30);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${item.descricao || item.codigo || 'Item sem descrição'}`, margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const firstBalance = data.balances[0];
      const lastBalance = data.balances[data.balances.length - 1];
      const firstValue = item.balances[firstBalance.id]?.diferenca_monetaria || 0;
      const lastValue = item.balances[lastBalance.id]?.diferenca_monetaria || 0;
      
      doc.text(`   • Impacto Financeiro: ${formatCurrency(item.variacao_monetaria || 0)} (piora)`, margin, yPosition);
      yPosition += 5;
      doc.text(`   • Situação Inicial: ${formatCurrency(firstValue)}`, margin, yPosition);
      yPosition += 5;
      doc.text(`   • Situação Final: ${formatCurrency(lastValue)}`, margin, yPosition);
      yPosition += 5;
      
      const quantidadeInicial = item.balances[firstBalance.id]?.diferenca_quantidade || 0;
      const quantidadeFinal = item.balances[lastBalance.id]?.diferenca_quantidade || 0;
      const variacaoQtd = quantidadeFinal - quantidadeInicial;
      
      if (Math.abs(variacaoQtd) > 0) {
        doc.text(`   • Variação em Quantidade: ${variacaoQtd > 0 ? '+' : ''}${variacaoQtd} unidades`, margin, yPosition);
        yPosition += 5;
      }
      
      // Prioridade e ação sugerida
      doc.setFont('helvetica', 'bold');
      const prioridade = index < 3 ? 'ALTA' : index < 7 ? 'MÉDIA' : 'BAIXA';
      const corPrioridade = index < 3 ? [220, 38, 38] : index < 7 ? [234, 179, 8] : [107, 114, 128];
      doc.setTextColor(corPrioridade[0], corPrioridade[1], corPrioridade[2]);
      doc.text(`   🎯 Prioridade: ${prioridade}`, margin, yPosition);
      yPosition += 5;
      
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'italic');
      if (Math.abs(lastValue) > Math.abs(firstValue)) {
        doc.text('   🔍 Ação: Investigar causas do aumento da divergência', margin, yPosition);
      } else {
        doc.text('   🔍 Ação: Revisar processo de contagem e controle', margin, yPosition);
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPosition += 12;
    });
  }

  // ========== RECOMENDAÇÕES ESTRATÉGICAS ==========
  addNewPage();
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('3. RECOMENDAÇÕES ESTRATÉGICAS', margin, yPosition);
  yPosition += 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AÇÕES PRIORITÁRIAS', margin, yPosition);
  yPosition += 15;

  const acoes = [
    variacao < 0 ? 'Documentar e replicar práticas que levaram à melhoria' : 'Investigar e corrigir causas da deterioração',
    `Focar nos ${Math.min(data.kpis.top_pioras.length, 5)} itens críticos identificados`,
    'Implementar contagem cíclica para itens de alta variação',
    'Revisar processos de entrada e saída de estoque',
    'Estabelecer alertas automáticos para divergências significativas'
  ];

  acoes.forEach((acao, index) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${index + 1}. ${acao}`, margin + 5, yPosition);
    yPosition += 10;
  });

  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CRONOGRAMA SUGERIDO', margin, yPosition);
  yPosition += 15;

  const cronograma = [
    'Semana 1-2: Análise detalhada dos itens críticos',
    'Semana 3-4: Implementação de melhorias nos processos',
    'Semana 5-6: Treinamento da equipe e ajustes',
    'Semana 7-8: Monitoramento e preparação para próxima contagem'
  ];

  cronograma.forEach((item) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`• ${item}`, margin + 5, yPosition);
    yPosition += 8;
  });

  yPosition += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('METAS PARA PRÓXIMO PERÍODO', margin, yPosition);
  yPosition += 15;

  const metas = [
    'Reduzir número de itens em déficit em 15%',
    `Melhorar resultado monetário em ${Math.abs(data.kpis.evolucao_resultado.variacao_percentual * 0.3).toFixed(1)}%`,
    'Aumentar precisão do inventário para 95%',
    'Implementar controle preventivo nos itens críticos'
  ];

  metas.forEach((meta) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`🎯 ${meta}`, margin + 5, yPosition);
    yPosition += 10;
  });

  // ========== RODAPÉ COM RESUMO ==========
  addNewPage();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO FINAL', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 30;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const resumoItems = [
    `Períodos analisados: ${firstPeriod.periodo} → ${lastPeriod.periodo}`,
    `Variação do resultado: ${formatCurrency(variacao)} (${data.kpis.evolucao_resultado.variacao_percentual.toFixed(1)}%)`,
    `Itens que melhoraram: ${data.kpis.top_melhorias.length}`,
    `Itens que pioraram: ${data.kpis.top_pioras.length}`,
    `Status geral: ${variacao >= 0 ? 'Requer atenção' : 'Em melhoria'}`,
    `Próxima análise recomendada: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}`
  ];

  resumoItems.forEach((item) => {
    doc.text(`• ${item}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  });

  // Salvar PDF
  const fileName = `Relatorio_Comparacao_${firstPeriod.periodo.replace(/[\/\s]/g, '-')}_vs_${lastPeriod.periodo.replace(/[\/\s]/g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return fileName;
};