import jsPDF from 'jspdf';
import type { ComparisonData } from '@/hooks/useBalanceComparison';

export async function generateComparisonSummaryPDF(data: ComparisonData) {
  const pdf = new jsPDF();
  let yPosition = 20;
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;

  // Helper functions
  const addNewPage = () => {
    pdf.addPage();
    yPosition = 20;
  };

  const checkPageBreak = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      addNewPage();
    }
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // CAPA + RESUMO EXECUTIVO
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO COMPARATIVO RESUMIDO', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  
  const periodos = data.balances.map(b => b.periodo).join(' vs ');
  pdf.text(`Períodos: ${periodos}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });

  // Resumo Executivo
  yPosition += 25;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMO EXECUTIVO', 20, yPosition);
  
  yPosition += 15;

  // KPIs principais em cards visuais
  const evolucaoResultado = data.kpis.evolucao_resultado.variacao;
  const statusGeral = evolucaoResultado >= 0 ? 'MELHORIA' : 'PIORA';
  const corStatus = evolucaoResultado >= 0 ? [34, 197, 94] : [220, 38, 38];

  // Card Status Geral
  pdf.setFillColor(corStatus[0], corStatus[1], corStatus[2]);
  pdf.rect(20, yPosition, 80, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('STATUS GERAL', 60, yPosition + 8, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text(statusGeral, 60, yPosition + 18, { align: 'center' });

  // Card Evolução Monetária
  pdf.setFillColor(66, 66, 66);
  pdf.rect(110, yPosition, 80, 25, 'F');
  
  pdf.text('EVOLUÇÃO MONETÁRIA', 150, yPosition + 8, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text(formatCurrency(evolucaoResultado), 150, yPosition + 18, { align: 'center' });

  pdf.setTextColor(0, 0, 0);
  yPosition += 35;

  // Métricas detalhadas
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const metricas = [
    ['Itens que Melhoraram:', `${data.kpis.top_melhorias.length} itens`],
    ['Itens que Pioraram:', `${data.kpis.top_pioras.length} itens`],
    ['Itens Mantidos:', `${data.kpis.evolucao_itens.neutros.final} itens`],
    ['Total de Itens Analisados:', `${data.itemsComparison.length} itens`]
  ];

  metricas.forEach(([label, value]) => {
    pdf.text(label, 25, yPosition);
    pdf.text(value, 130, yPosition);
    yPosition += 8;
  });

  // NOVA PÁGINA - TOP 10 MELHORIAS
  addNewPage();
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOP 10 MELHORIAS IDENTIFICADAS', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Itens com maior impacto positivo na comparação entre períodos', 20, yPosition);
  
  yPosition += 15;

  // Cabeçalho da tabela
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  const headers = ['Descrição', 'Qtd Ant.', 'Real Ant.', 'Qtd Atual', 'Real Atual', 'Dif.', 'Vlr Unit.', 'Impacto'];
  const colWidths = [35, 18, 18, 18, 18, 15, 20, 30];
  let xStart = 8;

  headers.forEach((header, i) => {
    if (i === 0) {
      pdf.text(header, xStart, yPosition);
    } else {
      // Centralizar headers das colunas numéricas
      const headerWidth = pdf.getTextWidth(header);
      pdf.text(header, xStart + (colWidths[i] - headerWidth) / 2, yPosition);
    }
    xStart += colWidths[i];
  });

  yPosition += 8;
  pdf.setFont('helvetica', 'normal');

  const topMelhorias = data.kpis.top_melhorias.slice(0, 10);

  topMelhorias.forEach((item) => {
    checkPageBreak(10);
    
    xStart = 8;
    const itemAtual = data.itemsComparison.find(comp => comp.codigo === item.codigo);
    
    const descricao = item.descricao || `Código: ${item.codigo}`;
    
    // Acessar dados do primeiro e último balanço
    const primeiroBalanco = data.balances[0];
    const ultimoBalanco = data.balances[data.balances.length - 1];
    
    const itemAnterior = itemAtual?.balances[primeiroBalanco.id];
    const itemAtualData = itemAtual?.balances[ultimoBalanco.id];
    
    const qtdSistemaAnterior = itemAnterior?.quantidade_sistema || 0;
    const qtdRealAnterior = itemAnterior?.quantidade_real || 0;
    const qtdSistemaAtual = itemAtualData?.quantidade_sistema || 0;
    const qtdRealAtual = itemAtualData?.quantidade_real || 0;
    const diferenca = qtdRealAtual - qtdRealAnterior;
    const valorUnitario = itemAnterior?.unitario || itemAtualData?.unitario || 0;
    
    const rowData = [
      descricao.length > 25 ? descricao.substring(0, 25) + '...' : descricao,
      formatNumber(qtdSistemaAnterior),
      formatNumber(qtdRealAnterior),
      formatNumber(qtdSistemaAtual),
      formatNumber(qtdRealAtual),
      formatNumber(diferenca),
      formatCurrency(valorUnitario),
      formatCurrency(item.variacao_monetaria)
    ];

    rowData.forEach((data, i) => {
      if (i === 0) {
        pdf.text(data, xStart, yPosition);
      } else {
        // Centralizar dados das colunas numéricas
        const dataWidth = pdf.getTextWidth(data);
        pdf.text(data, xStart + (colWidths[i] - dataWidth) / 2, yPosition);
        
        if (i === 7) { // Impacto - colorir se positivo
          pdf.setTextColor(34, 197, 94); // Verde
          pdf.text(data, xStart + (colWidths[i] - dataWidth) / 2, yPosition);
          pdf.setTextColor(0, 0, 0);
        }
      }
      
      xStart += colWidths[i];
    });

    yPosition += 7;
  });

  // NOVA PÁGINA - TOP 10 PIORAS
  addNewPage();
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOP 10 ITENS QUE PIORARAM', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Itens com maior impacto negativo que requerem atenção imediata', 20, yPosition);
  
  yPosition += 15;

  // Cabeçalho da tabela
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  xStart = 8;

  headers.forEach((header, i) => {
    if (i === 0) {
      pdf.text(header, xStart, yPosition);
    } else {
      // Centralizar headers das colunas numéricas
      const headerWidth = pdf.getTextWidth(header);
      pdf.text(header, xStart + (colWidths[i] - headerWidth) / 2, yPosition);
    }
    xStart += colWidths[i];
  });

  yPosition += 8;
  pdf.setFont('helvetica', 'normal');

  const topPioras = data.kpis.top_pioras.slice(0, 10);

  topPioras.forEach((item) => {
    checkPageBreak(10);
    
    xStart = 8;
    const itemAtual = data.itemsComparison.find(comp => comp.codigo === item.codigo);
    
    const descricao = item.descricao || `Código: ${item.codigo}`;
    
    // Acessar dados do primeiro e último balanço
    const primeiroBalanco = data.balances[0];
    const ultimoBalanco = data.balances[data.balances.length - 1];
    
    const itemAnterior = itemAtual?.balances[primeiroBalanco.id];
    const itemAtualData = itemAtual?.balances[ultimoBalanco.id];
    
    const qtdSistemaAnterior = itemAnterior?.quantidade_sistema || 0;
    const qtdRealAnterior = itemAnterior?.quantidade_real || 0;
    const qtdSistemaAtual = itemAtualData?.quantidade_sistema || 0;
    const qtdRealAtual = itemAtualData?.quantidade_real || 0;
    const diferenca = qtdRealAtual - qtdRealAnterior;
    const valorUnitario = itemAnterior?.unitario || itemAtualData?.unitario || 0;
    
    const rowData = [
      descricao.length > 25 ? descricao.substring(0, 25) + '...' : descricao,
      formatNumber(qtdSistemaAnterior),
      formatNumber(qtdRealAnterior),
      formatNumber(qtdSistemaAtual),
      formatNumber(qtdRealAtual),
      formatNumber(diferenca),
      formatCurrency(valorUnitario),
      formatCurrency(item.variacao_monetaria)
    ];

    rowData.forEach((data, i) => {
      if (i === 0) {
        pdf.text(data, xStart, yPosition);
      } else {
        // Centralizar dados das colunas numéricas
        const dataWidth = pdf.getTextWidth(data);
        pdf.text(data, xStart + (colWidths[i] - dataWidth) / 2, yPosition);
        
        if (i === 7) { // Impacto - colorir se negativo
          pdf.setTextColor(220, 38, 38); // Vermelho
          pdf.text(data, xStart + (colWidths[i] - dataWidth) / 2, yPosition);
          pdf.setTextColor(0, 0, 0);
        }
      }
      
      xStart += colWidths[i];
    });

    yPosition += 7;
  });

  // NOVA PÁGINA - RECOMENDAÇÕES OBJETIVAS
  addNewPage();
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RECOMENDAÇÕES ESTRATÉGICAS', 20, yPosition);
  
  yPosition += 20;

  // Ações Prioritárias
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AÇÕES PRIORITÁRIAS:', 20, yPosition);
  yPosition += 12;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const acoesPrioritarias = [];
  
  if (topPioras.length > 0) {
    acoesPrioritarias.push('Investigar imediatamente os itens com maior piora identificados');
    acoesPrioritarias.push('Revisar processos de controle de estoque para itens críticos');
  }
  
  if (topMelhorias.length > 0) {
    acoesPrioritarias.push('Manter e replicar boas práticas dos itens que melhoraram');
  }
  
  acoesPrioritarias.push('Implementar monitoramento contínuo dos indicadores principais');
  acoesPrioritarias.push('Estabelecer metas específicas para o próximo período');

  acoesPrioritarias.forEach((acao, index) => {
    checkPageBreak(12);
    pdf.text(`${index + 1}. ${acao}`, 25, yPosition);
    yPosition += 10;
  });

  yPosition += 10;

  // Cronograma Sugerido
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CRONOGRAMA SUGERIDO:', 20, yPosition);
  yPosition += 12;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const cronograma = [
    'Semana 1: Análise detalhada dos itens críticos',
    'Semana 2-3: Implementação de correções nos processos',
    'Semana 4: Monitoramento dos resultados iniciais',
    'Próximo mês: Avaliação completa e ajustes necessários'
  ];

  cronograma.forEach((item) => {
    checkPageBreak(8);
    pdf.text(`• ${item}`, 25, yPosition);
    yPosition += 8;
  });

  yPosition += 15;

  // Metas para próximo período
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('METAS PARA PRÓXIMO PERÍODO:', 20, yPosition);
  yPosition += 12;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const resultadoAtual = data.kpis.evolucao_resultado.variacao;
  const metaAbsoluta = Math.abs(resultadoAtual) * 0.5; // Meta de reduzir pela metade
  const metaMelhoria = resultadoAtual >= 0 ? resultadoAtual * 1.2 : resultadoAtual * 0.8;

  const metas = [
    `Reduzir discrepâncias em pelo menos ${formatCurrency(metaAbsoluta)}`,
    `Melhorar resultado geral para ${formatCurrency(metaMelhoria)}`,
    'Implementar controles preventivos para itens críticos identificados',
    'Reduzir em 20% o número de itens com variação negativa'
  ];

  metas.forEach((meta) => {
    checkPageBreak(8);
    pdf.text(`• ${meta}`, 25, yPosition);
    yPosition += 8;
  });

  // Rodapé final
  yPosition += 20;
  checkPageBreak(15);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Este relatório foi gerado automaticamente pelo sistema de análise de estoque.', pageWidth / 2, yPosition, { align: 'center' });

  // Salvar PDF
  const periodoFileName = data.balances.map(b => b.periodo).join('_vs_').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Relatório_Comparativo_Resumido_${periodoFileName}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}