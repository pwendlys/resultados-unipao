
import jsPDF from 'jspdf';
import { CustomReportConfig } from '@/components/custom-reports/CustomReports';
import { format } from 'date-fns';

interface CategoryData {
  id: string;
  name: string;
  type: 'entrada' | 'saida';
  total: number;
  transactionCount: number;
}

interface CategoryTotals {
  name: string;
  type: string;
  total: number;
  count: number;
}

interface CustomReportData {
  filteredTransactions: any[];
  categorizedTransactions: any[];
  entryTransactions: any[];
  exitTransactions: any[];
  totalEntries: number;
  totalExits: number;
  netResult: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return dateString;
  }
};

export const generateCustomReport = (data: CustomReportData, config: CustomReportConfig) => {
  try {
    console.log('Iniciando geração do relatório personalizado:', { data, config });
    
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Função para adicionar nova página se necessário
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Cabeçalho personalizado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(config.reportTitle, margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Informações do relatório
    const accountsText = config.selectedAccounts.length === 0 
      ? 'Todas as contas'
      : `Contas: ${config.selectedAccounts.join(', ')}`;
    doc.text(accountsText, margin, yPosition);
    yPosition += 8;
    
    // Período
    if (config.dateFrom || config.dateTo) {
      let periodText = 'Período: ';
      if (config.dateFrom && config.dateTo) {
        periodText += `${format(config.dateFrom, 'dd/MM/yyyy')} até ${format(config.dateTo, 'dd/MM/yyyy')}`;
      } else if (config.dateFrom) {
        periodText += `A partir de ${format(config.dateFrom, 'dd/MM/yyyy')}`;
      } else if (config.dateTo) {
        periodText += `Até ${format(config.dateTo, 'dd/MM/yyyy')}`;
      }
      doc.text(periodText, margin, yPosition);
      yPosition += 8;
    } else {
      doc.text('Período: Todos os períodos', margin, yPosition);
      yPosition += 8;
    }
    
    // Tipos incluídos
    const typesText = [];
    if (config.includeEntries) typesText.push('Entradas');
    if (config.includeExits) typesText.push('Saídas');
    doc.text(`Tipos: ${typesText.join(', ')}`, margin, yPosition);
    yPosition += 8;
    
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
    yPosition += 20;

    // Resumo Executivo
    checkPageBreak(80);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    if (config.includeEntries) {
      doc.text(`Total de Receitas: ${formatCurrency(data.totalEntries)}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Transações de Entrada: ${data.entryTransactions.length}`, margin + 10, yPosition);
      yPosition += 8;
    }
    
    if (config.includeExits) {
      doc.text(`Total de Despesas: ${formatCurrency(data.totalExits)}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Transações de Saída: ${data.exitTransactions.length}`, margin + 10, yPosition);
      yPosition += 8;
    }
    
    if (config.includeEntries && config.includeExits) {
      doc.text(`Resultado Líquido: ${formatCurrency(data.netResult)}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Status: ${data.netResult >= 0 ? 'Superávit' : 'Déficit'}`, margin, yPosition);
      yPosition += 8;
    }
    
    doc.text(`Total de Transações: ${data.filteredTransactions.length}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Transações Categorizadas: ${data.categorizedTransactions.length}`, margin, yPosition);
    yPosition += 20;

    // Análise por categorias (se houver transações categorizadas)
    if (data.categorizedTransactions.length > 0) {
      // Agrupar por categoria
      const categoryTotals = data.categorizedTransactions.reduce((acc, transaction) => {
        const category = transaction.category || 'Sem Categoria';
        if (!acc[category]) {
          acc[category] = {
            name: category,
            type: transaction.type,
            total: 0,
            count: 0
          };
        }
        acc[category].total += Number(transaction.amount);
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, CategoryTotals>);

      const sortedCategories = (Object.values(categoryTotals) as CategoryTotals[]).sort((a, b) => b.total - a.total);

      if (config.includeEntries) {
        const entryCategories = sortedCategories.filter(c => c.type === 'entrada');
        if (entryCategories.length > 0) {
          checkPageBreak(40);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('RECEITAS POR CATEGORIA', margin, yPosition);
          yPosition += 15;

          entryCategories.forEach((category) => {
            checkPageBreak(25);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${category.name}`, margin, yPosition);
            yPosition += 8;
            
            doc.setFont('helvetica', 'normal');
            doc.text(`Valor: ${formatCurrency(category.total)}`, margin + 10, yPosition);
            yPosition += 6;
            doc.text(`Transações: ${category.count}`, margin + 10, yPosition);
            yPosition += 6;
            doc.text(`Média por transação: ${formatCurrency(category.total / category.count)}`, margin + 10, yPosition);
            yPosition += 6;
            if (data.totalEntries > 0) {
              doc.text(`Percentual do total: ${((category.total / data.totalEntries) * 100).toFixed(1)}%`, margin + 10, yPosition);
              yPosition += 6;
            }
            yPosition += 8;
          });

          checkPageBreak(15);
          doc.setFont('helvetica', 'bold');
          doc.text(`TOTAL DE RECEITAS: ${formatCurrency(data.totalEntries)}`, margin, yPosition);
          yPosition += 20;
        }
      }

      if (config.includeExits) {
        const exitCategories = sortedCategories.filter(c => c.type === 'saida');
        if (exitCategories.length > 0) {
          checkPageBreak(40);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('DESPESAS POR CATEGORIA', margin, yPosition);
          yPosition += 15;

          exitCategories.forEach((category) => {
            checkPageBreak(25);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${category.name}`, margin, yPosition);
            yPosition += 8;
            
            doc.setFont('helvetica', 'normal');
            doc.text(`Valor: ${formatCurrency(category.total)}`, margin + 10, yPosition);
            yPosition += 6;
            doc.text(`Transações: ${category.count}`, margin + 10, yPosition);
            yPosition += 6;
            doc.text(`Média por transação: ${formatCurrency(category.total / category.count)}`, margin + 10, yPosition);
            yPosition += 6;
            if (data.totalExits > 0) {
              doc.text(`Percentual do total: ${((category.total / data.totalExits) * 100).toFixed(1)}%`, margin + 10, yPosition);
              yPosition += 6;
            }
            yPosition += 8;
          });

          checkPageBreak(15);
          doc.setFont('helvetica', 'bold');
          doc.text(`TOTAL DE DESPESAS: ${formatCurrency(data.totalExits)}`, margin, yPosition);
          yPosition += 20;
        }
      }
    }

    // Detalhamento das transações (primeiras 50 para não sobrecarregar o PDF)
    if (data.categorizedTransactions.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DAS TRANSAÇÕES', margin, yPosition);
      yPosition += 10;
      
      if (data.categorizedTransactions.length > 50) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`(Mostrando as primeiras 50 de ${data.categorizedTransactions.length} transações)`, margin, yPosition);
        yPosition += 15;
      } else {
        yPosition += 5;
      }

      const transactionsToShow = data.categorizedTransactions.slice(0, 50);
      
      transactionsToShow.forEach((transaction, index) => {
        checkPageBreak(20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${formatDate(transaction.date)} - ${transaction.type.toUpperCase()}`, margin, yPosition);
        yPosition += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Valor: ${formatCurrency(Number(transaction.amount))}`, margin + 5, yPosition);
        yPosition += 4;
        doc.text(`Categoria: ${transaction.category || 'Sem categoria'}`, margin + 5, yPosition);
        yPosition += 4;
        
        const description = (transaction.description || '').substring(0, 80);
        doc.text(`Descrição: ${description}${transaction.description && transaction.description.length > 80 ? '...' : ''}`, margin + 5, yPosition);
        yPosition += 4;
        
        if (transaction.observacao) {
          const obs = transaction.observacao.substring(0, 60);
          doc.text(`Obs: ${obs}${transaction.observacao.length > 60 ? '...' : ''}`, margin + 5, yPosition);
          yPosition += 4;
        }
        yPosition += 6;
      });
    }

    // Rodapé final
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESULTADO FINAL', margin, yPosition);
    yPosition += 20;

    doc.setFontSize(14);

    if (config.includeEntries) {
      doc.text(`Total de Receitas: ${formatCurrency(data.totalEntries)}`, margin, yPosition);
      yPosition += 12;
    }

    if (config.includeExits) {
      doc.text(`Total de Despesas: ${formatCurrency(data.totalExits)}`, margin, yPosition);
      yPosition += 12;
    }

    if (config.includeEntries && config.includeExits) {
      doc.text(`Resultado Líquido: ${formatCurrency(data.netResult)}`, margin, yPosition);
      yPosition += 12;
      doc.text(`Status: ${data.netResult >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}`, margin, yPosition);
    }

    // Gerar nome do arquivo
    let fileName = config.reportTitle.replace(/\s+/g, '_');
    if (config.dateFrom && config.dateTo) {
      fileName += `_${format(config.dateFrom, 'dd-MM-yyyy')}_a_${format(config.dateTo, 'dd-MM-yyyy')}`;
    }
    fileName += `_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(fileName);
    
    console.log('Relatório personalizado gerado com sucesso:', fileName);
    return true;
  } catch (error) {
    console.error('Erro ao gerar relatório personalizado:', error);
    throw error;
  }
};
