import jsPDF from 'jspdf';
import type { BalancoEstoque, ItemBalanco } from '@/hooks/useStockBalance';

export async function generateBalancePDF(itens: ItemBalanco[], balanco: BalancoEstoque) {
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

  // CAPA
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO DE BALANÇO DE ESTOQUE', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Período: ${balanco.periodo}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.text(`Arquivo: ${balanco.nome}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  pdf.setFontSize(12);
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });

  // Resumo Executivo na Capa
  yPosition += 30;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMO EXECUTIVO', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const resumoData = [
    ['Total de Itens:', balanco.total_itens.toString()],
    ['Itens em Déficit:', balanco.itens_negativos.toString()],
    ['Itens em Superávit:', balanco.itens_positivos.toString()],
    ['Itens Neutros:', balanco.itens_neutros.toString()],
    ['Resultado Monetário:', formatCurrency(balanco.resultado_monetario)]
  ];

  resumoData.forEach(([label, value]) => {
    pdf.text(label, 30, yPosition);
    pdf.text(value, 120, yPosition);
    yPosition += 8;
  });

  // NOVA PÁGINA - INDICADORES PRINCIPAIS
  addNewPage();
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INDICADORES PRINCIPAIS', 20, yPosition);
  
  yPosition += 20;
  
  // KPIs em formato de cards
  const kpis = [
    { title: 'DÉFICIT', value: balanco.itens_negativos, color: [220, 38, 38] },
    { title: 'SUPERÁVIT', value: balanco.itens_positivos, color: [34, 197, 94] },
    { title: 'NEUTROS', value: balanco.itens_neutros, color: [156, 163, 175] }
  ];

  const cardWidth = 50;
  const cardHeight = 30;
  let xPos = 20;

  kpis.forEach((kpi) => {
    // Card background
    pdf.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    pdf.rect(xPos, yPosition, cardWidth, cardHeight, 'F');
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.title, xPos + cardWidth/2, yPosition + 10, { align: 'center' });
    
    // Value
    pdf.setFontSize(16);
    pdf.text(kpi.value.toString(), xPos + cardWidth/2, yPosition + 22, { align: 'center' });
    
    xPos += cardWidth + 10;
  });

  // Reset text color
  pdf.setTextColor(0, 0, 0);
  yPosition += cardHeight + 20;

  // Resultado Monetário destacado
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IMPACTO MONETÁRIO TOTAL:', 20, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(18);
  const cor = balanco.resultado_monetario >= 0 ? [34, 197, 94] : [220, 38, 38];
  pdf.setTextColor(cor[0], cor[1], cor[2]);
  pdf.text(formatCurrency(balanco.resultado_monetario), 20, yPosition);
  pdf.setTextColor(0, 0, 0);

  // NOVA PÁGINA - TOP 20 DISCREPÂNCIAS
  addNewPage();
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOP 20 MAIORES DISCREPÂNCIAS', 20, yPosition);
  
  yPosition += 15;

  // Ordenar itens por impacto monetário absoluto
  const topDiscrepancias = itens
    .filter(item => Math.abs(item.diferenca_monetaria || 0) > 0)
    .sort((a, b) => Math.abs(b.diferenca_monetaria || 0) - Math.abs(a.diferenca_monetaria || 0))
    .slice(0, 20);

  // Cabeçalho da tabela
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  const headers = ['Código', 'Descrição', 'Qtd Sist.', 'Qtd Real', 'Dif. Qtd', 'Vlr Unit.', 'Impacto'];
  const colWidths = [18, 50, 18, 18, 18, 22, 30];
  let xStart = 8;

  headers.forEach((header, i) => {
    pdf.text(header, xStart, yPosition);
    xStart += colWidths[i];
  });

  yPosition += 8;
  pdf.setFont('helvetica', 'normal');

  topDiscrepancias.forEach((item) => {
    checkPageBreak(10);
    
    xStart = 8;
    const rowData = [
      item.codigo || '',
      (item.descricao || '').substring(0, 22) + ((item.descricao || '').length > 22 ? '...' : ''),
      formatNumber(item.quantidade_sistema),
      formatNumber(item.quantidade_real),
      formatNumber(item.diferenca_quantidade),
      formatCurrency(item.unitario),
      formatCurrency(item.diferenca_monetaria)
    ];

    rowData.forEach((data, i) => {
      if (i === 6) { // Impacto monetário
        const color = (item.diferenca_monetaria || 0) >= 0 ? [34, 197, 94] : [220, 38, 38];
        pdf.setTextColor(color[0], color[1], color[2]);
      }
      
      pdf.text(data, xStart, yPosition);
      
      if (i === 6) {
        pdf.setTextColor(0, 0, 0);
      }
      
      xStart += colWidths[i];
    });

    yPosition += 8;
  });

  // NOVA PÁGINA - RELATÓRIO COMPLETO
  addNewPage();
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO COMPLETO DE ITENS', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total de ${itens.length} itens processados`, 20, yPosition);
  
  yPosition += 15;

  // Tabela completa (paginada)
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  
  const renderTableHeader = () => {
    const headerY = yPosition;
    xStart = 5;
    
    headers.forEach((header, i) => {
      pdf.text(header, xStart, headerY);
      xStart += colWidths[i];
    });
    
    yPosition += 8;
  };

  renderTableHeader();
  pdf.setFont('helvetica', 'normal');

  itens.forEach((item, index) => {
    checkPageBreak(10);
    
    if (yPosition === 20) { // Nova página
      renderTableHeader();
    }
    
    xStart = 5;
    const rowData = [
      item.codigo || '',
      (item.descricao || '').substring(0, 20) + ((item.descricao || '').length > 20 ? '...' : ''),
      formatNumber(item.quantidade_sistema),
      formatNumber(item.quantidade_real),
      formatNumber(item.diferenca_quantidade),
      formatCurrency(item.unitario),
      formatCurrency(item.diferenca_monetaria)
    ];

    rowData.forEach((data, i) => {
      if (i === 6) { // Impacto monetário
        const color = (item.diferenca_monetaria || 0) >= 0 ? [34, 197, 94] : [220, 38, 38];
        pdf.setTextColor(color[0], color[1], color[2]);
      }
      
      pdf.text(data, xStart, yPosition);
      
      if (i === 6) {
        pdf.setTextColor(0, 0, 0);
      }
      
      xStart += colWidths[i];
    });

    yPosition += 6;
  });

  // NOVA PÁGINA - ANÁLISE E RECOMENDAÇÕES
  addNewPage();
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ANÁLISE E RECOMENDAÇÕES', 20, yPosition);
  
  yPosition += 20;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  const analises = [
    {
      titulo: 'ITENS CRÍTICOS (Maior Impacto Negativo)',
      itens: topDiscrepancias.filter(item => (item.diferenca_monetaria || 0) < 0).slice(0, 5)
    },
    {
      titulo: 'MELHORIAS IDENTIFICADAS (Maior Impacto Positivo)',
      itens: topDiscrepancias.filter(item => (item.diferenca_monetaria || 0) > 0).slice(0, 5)
    }
  ];

  analises.forEach((secao) => {
    checkPageBreak(30);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(secao.titulo, 20, yPosition);
    yPosition += 12;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    secao.itens.forEach((item, index) => {
      checkPageBreak(15);
      
      const impacto = formatCurrency(item.diferenca_monetaria);
      const descricao = item.descricao || `Código: ${item.codigo}`;
      
      pdf.text(`${index + 1}. ${descricao}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`   Impacto: ${impacto} | Diferença: ${formatNumber(item.diferenca_quantidade)} unidades`, 25, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
  });

  // Recomendações finais
  checkPageBreak(40);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RECOMENDAÇÕES GERAIS', 20, yPosition);
  yPosition += 12;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const recomendacoes = [
    'Priorizar a correção dos itens com maior impacto negativo',
    'Investigar causas das discrepâncias recorrentes',
    'Implementar controles mais rigorosos para itens críticos',
    'Revisar processos de contagem e registro',
    'Acompanhar evolução dos indicadores mensalmente'
  ];

  recomendacoes.forEach((rec, index) => {
    pdf.text(`${index + 1}. ${rec}`, 25, yPosition);
    yPosition += 8;
  });

  // Salvar PDF
  const filename = `Relatório_Balanço_${balanco.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}