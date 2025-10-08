import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EntradaPersonalizada } from '@/hooks/useCustomEntries';

interface CustomDashboardPDFData {
  dashboardName: string;
  entries: EntradaPersonalizada[];
  summary: {
    totalEntradas: number;
    totalSaidas: number;
    saldoLiquido: number;
    totalRegistros: number;
    categorias: string[];
  };
  evolucaoMensal: Array<{
    periodo: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
  categorias: Array<{
    nome: string;
    tipo: 'entrada' | 'saida';
    total: number;
    count: number;
  }>;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatMes = (mes: number): string => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return meses[mes - 1] || '';
};

export const prepareCustomDashboardData = (
  entries: EntradaPersonalizada[],
  dashboardName: string
): CustomDashboardPDFData => {
  // Calcular totais
  const totalEntradas = entries
    .filter(e => e.tipo === 'entrada')
    .reduce((sum, e) => sum + Number(e.valor), 0);
  
  const totalSaidas = entries
    .filter(e => e.tipo === 'saida')
    .reduce((sum, e) => sum + Number(e.valor), 0);

  const categorias = [...new Set(entries.map(e => e.categoria))];

  // Evolução mensal
  const evolucaoMensal = entries.reduce((acc, entry) => {
    const key = `${entry.ano}-${entry.mes.toString().padStart(2, '0')}`;
    const monthName = new Date(entry.ano, entry.mes - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    if (!acc[key]) {
      acc[key] = {
        periodo: monthName,
        entradas: 0,
        saidas: 0,
        saldo: 0,
        sortKey: `${entry.ano}-${entry.mes.toString().padStart(2, '0')}`
      };
    }
    
    if (entry.tipo === 'entrada') {
      acc[key].entradas += Number(entry.valor);
    } else {
      acc[key].saidas += Number(entry.valor);
    }
    
    acc[key].saldo = acc[key].entradas - acc[key].saidas;
    
    return acc;
  }, {} as Record<string, any>);

  const evolucaoArray = Object.values(evolucaoMensal).sort((a: any, b: any) => 
    a.sortKey.localeCompare(b.sortKey)
  );

  // Distribuição por categoria
  const distribuicaoCategoria = entries.reduce((acc, entry) => {
    if (!acc[entry.categoria]) {
      acc[entry.categoria] = {
        nome: entry.categoria,
        tipo: entry.tipo as 'entrada' | 'saida',
        total: 0,
        count: 0
      };
    }
    
    acc[entry.categoria].total += Number(entry.valor);
    acc[entry.categoria].count += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const categoriasArray = Object.values(distribuicaoCategoria);

  return {
    dashboardName,
    entries,
    summary: {
      totalEntradas,
      totalSaidas,
      saldoLiquido: totalEntradas - totalSaidas,
      totalRegistros: entries.length,
      categorias
    },
    evolucaoMensal: evolucaoArray,
    categorias: categoriasArray
  };
};

export const generateCustomDashboardPDF = async (
  data: CustomDashboardPDFData,
  chartsElement?: HTMLElement
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Função auxiliar para adicionar nova página
  const addNewPage = () => {
    pdf.addPage();
    yPosition = margin;
  };

  // Função para verificar se precisa de nova página
  const checkNewPage = (heightNeeded: number) => {
    if (yPosition + heightNeeded > pageHeight - margin) {
      addNewPage();
    }
  };

  // ========== PÁGINA 1 - CAPA E RESUMO ==========
  
  // Cabeçalho
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO OPERACIONAL', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.dashboardName, pageWidth / 2, 30, { align: 'center' });

  yPosition = 50;

  // Data de geração
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.text(`Gerado em: ${formatDate(new Date())}`, margin, yPosition);
  yPosition += 10;

  // Período
  if (data.entries.length > 0) {
    const sortedEntries = [...data.entries].sort((a, b) => {
      const dateA = new Date(a.ano, a.mes - 1);
      const dateB = new Date(b.ano, b.mes - 1);
      return dateA.getTime() - dateB.getTime();
    });
    const primeiraEntrada = sortedEntries[0];
    const ultimaEntrada = sortedEntries[sortedEntries.length - 1];
    const periodo = `${formatMes(primeiraEntrada.mes)}/${primeiraEntrada.ano} - ${formatMes(ultimaEntrada.mes)}/${ultimaEntrada.ano}`;
    pdf.text(`Período: ${periodo}`, margin, yPosition);
    yPosition += 15;
  }

  // Cards de resumo
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMO OPERACIONAL', margin, yPosition);
  yPosition += 10;

  // Desenhar cards
  const cardWidth = (pageWidth - 3 * margin) / 2;
  const cardHeight = 25;
  
  // Card 1 - Total Entradas
  pdf.setDrawColor(34, 197, 94);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPosition, cardWidth, cardHeight);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Total de Receitas', margin + 5, yPosition + 8);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 197, 94);
  pdf.text(formatCurrency(data.summary.totalEntradas), margin + 5, yPosition + 18);

  // Card 2 - Total Saídas
  pdf.setDrawColor(239, 68, 68);
  pdf.rect(margin + cardWidth + margin, yPosition, cardWidth, cardHeight);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Total de Despesas', margin + cardWidth + margin + 5, yPosition + 8);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(239, 68, 68);
  pdf.text(formatCurrency(data.summary.totalSaidas), margin + cardWidth + margin + 5, yPosition + 18);

  yPosition += cardHeight + 10;

  // Card 3 - Saldo Líquido
  pdf.setDrawColor(59, 130, 246);
  pdf.rect(margin, yPosition, cardWidth, cardHeight);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Saldo Líquido', margin + 5, yPosition + 8);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const saldoColor = data.summary.saldoLiquido >= 0 ? [34, 197, 94] : [239, 68, 68];
  pdf.setTextColor(saldoColor[0], saldoColor[1], saldoColor[2]);
  pdf.text(formatCurrency(data.summary.saldoLiquido), margin + 5, yPosition + 18);

  // Card 4 - Total de Registros
  pdf.setDrawColor(168, 85, 247);
  pdf.rect(margin + cardWidth + margin, yPosition, cardWidth, cardHeight);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Total de Entradas', margin + cardWidth + margin + 5, yPosition + 8);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(168, 85, 247);
  pdf.text(`${data.summary.totalRegistros}`, margin + cardWidth + margin + 5, yPosition + 18);

  yPosition += cardHeight + 15;

  // Evolução mensal (tabela resumida)
  checkNewPage(60);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('EVOLUÇÃO MENSAL', margin, yPosition);
  yPosition += 8;

  // Cabeçalho da tabela
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Período', margin + 3, yPosition + 5);
  pdf.text('Entradas', margin + 45, yPosition + 5);
  pdf.text('Saídas', margin + 85, yPosition + 5);
  pdf.text('Saldo', margin + 125, yPosition + 5);
  yPosition += 10;

  // Linhas da tabela (últimos 6 meses)
  pdf.setFont('helvetica', 'normal');
  const recentMonths = data.evolucaoMensal.slice(-6);
  recentMonths.forEach((mes, index) => {
    checkNewPage(8);
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 8, 'F');
    }
    pdf.setTextColor(0, 0, 0);
    pdf.text(mes.periodo, margin + 3, yPosition + 3);
    pdf.setTextColor(34, 197, 94);
    pdf.text(formatCurrency(mes.entradas), margin + 45, yPosition + 3);
    pdf.setTextColor(239, 68, 68);
    pdf.text(formatCurrency(mes.saidas), margin + 85, yPosition + 3);
    pdf.setTextColor(mes.saldo >= 0 ? 34 : 239, mes.saldo >= 0 ? 197 : 68, mes.saldo >= 0 ? 94 : 68);
    pdf.text(formatCurrency(mes.saldo), margin + 125, yPosition + 3);
    yPosition += 8;
  });

  // ========== PÁGINA 2 - GRÁFICOS ==========
  if (chartsElement) {
    addNewPage();
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('ANÁLISE GRÁFICA', margin, yPosition);
    yPosition += 10;

    try {
      const canvas = await html2canvas(chartsElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Se a imagem for muito alta, dividir em páginas
      if (imgHeight > pageHeight - yPosition - margin) {
        const ratio = (pageHeight - yPosition - margin) / imgHeight;
        const adjustedHeight = imgHeight * ratio;
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth * ratio, adjustedHeight);
      } else {
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      }
      
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Erro ao capturar gráficos:', error);
    }
  }

  // ========== PÁGINAS 3+ - DETALHAMENTO DE MOVIMENTAÇÕES ==========
  addNewPage();
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DETALHAMENTO DE MOVIMENTAÇÕES', margin, yPosition);
  yPosition += 10;

  // Cabeçalho da tabela
  pdf.setFillColor(59, 130, 246);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Período', margin + 2, yPosition + 6);
  pdf.text('Categoria', margin + 25, yPosition + 6);
  pdf.text('Tipo', margin + 65, yPosition + 6);
  pdf.text('Valor', margin + 85, yPosition + 6);
  pdf.text('Descrição', margin + 115, yPosition + 6);
  yPosition += 12;

  // Ordenar entradas por ano e mês
  const sortedEntries = [...data.entries].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });

  // Linhas da tabela
  pdf.setFont('helvetica', 'normal');
  sortedEntries.forEach((entry, index) => {
    checkNewPage(10);
    
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 'F');
    }

    pdf.setTextColor(0, 0, 0);
    pdf.text(`${formatMes(entry.mes)}/${entry.ano}`, margin + 2, yPosition + 4);
    pdf.text(entry.categoria.substring(0, 15), margin + 25, yPosition + 4);
    
    if (entry.tipo === 'entrada') {
      pdf.setTextColor(34, 197, 94);
      pdf.text('Receita', margin + 65, yPosition + 4);
    } else {
      pdf.setTextColor(239, 68, 68);
      pdf.text('Despesa', margin + 65, yPosition + 4);
    }
    
    pdf.setTextColor(entry.tipo === 'entrada' ? 34 : 239, entry.tipo === 'entrada' ? 197 : 68, entry.tipo === 'entrada' ? 94 : 68);
    pdf.text(formatCurrency(Number(entry.valor)), margin + 85, yPosition + 4);
    
    pdf.setTextColor(100, 100, 100);
    const descricao = entry.descricao || '-';
    pdf.text(descricao.substring(0, 30), margin + 115, yPosition + 4);
    
    yPosition += 10;
  });

  // ========== PÁGINA FINAL - INSIGHTS ==========
  addNewPage();
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('INSIGHTS E ANÁLISES', margin, yPosition);
  yPosition += 15;

  // Principais categorias de receita
  const categoriasReceita = data.categorias
    .filter(c => c.tipo === 'entrada')
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  if (categoriasReceita.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Principais Categorias de Receita:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    categoriasReceita.forEach((cat, index) => {
      pdf.setTextColor(34, 197, 94);
      pdf.text(`${index + 1}. ${cat.nome}: ${formatCurrency(cat.total)} (${cat.count} lançamentos)`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Principais categorias de despesa
  const categoriasDespesa = data.categorias
    .filter(c => c.tipo === 'saida')
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  if (categoriasDespesa.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Principais Categorias de Despesa:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    categoriasDespesa.forEach((cat, index) => {
      pdf.setTextColor(239, 68, 68);
      pdf.text(`${index + 1}. ${cat.nome}: ${formatCurrency(cat.total)} (${cat.count} lançamentos)`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Mês com maior movimentação
  if (data.evolucaoMensal.length > 0) {
    const mesComMaiorSaldo = [...data.evolucaoMensal].sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo))[0];
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Mês com Maior Movimentação:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(59, 130, 246);
    pdf.text(`${mesComMaiorSaldo.periodo}: ${formatCurrency(Math.abs(mesComMaiorSaldo.saldo))}`, margin + 5, yPosition);
    yPosition += 10;
  }

  // Tendência
  if (data.evolucaoMensal.length >= 2) {
    const primeiroMes = data.evolucaoMensal[0];
    const ultimoMes = data.evolucaoMensal[data.evolucaoMensal.length - 1];
    const tendencia = ultimoMes.saldo > primeiroMes.saldo ? 'crescimento' : 'decrescimento';
    const percentual = primeiroMes.saldo !== 0 
      ? ((ultimoMes.saldo - primeiroMes.saldo) / Math.abs(primeiroMes.saldo) * 100).toFixed(1)
      : '0';
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Tendência do Período:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const tendenciaColor = tendencia === 'crescimento' ? [34, 197, 94] : [239, 68, 68];
    pdf.setTextColor(tendenciaColor[0], tendenciaColor[1], tendenciaColor[2]);
    pdf.text(`${tendencia.toUpperCase()} de ${percentual}%`, margin + 5, yPosition);
  }

  // Rodapé
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Página ${i} de ${totalPages} - ${data.dashboardName}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Salvar PDF
  const fileName = `Dashboard_${data.dashboardName.replace(/\s+/g, '_')}_${formatDate(new Date()).replace(/\//g, '-')}.pdf`;
  pdf.save(fileName);
};
