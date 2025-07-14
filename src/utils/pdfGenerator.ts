
import jsPDF from 'jspdf';
import { Transaction } from '@/hooks/useSupabaseData';

interface CategoryData {
  id: string;
  name: string;
  type: 'entrada' | 'saida';
  total: number;
  transactionCount: number;
  transactions: Transaction[];
}

interface ReportData {
  selectedAccount: string;
  entryCategories: CategoryData[];
  exitCategories: CategoryData[];
  totalEntries: number;
  totalExits: number;
  netResult: number;
  categorizedTransactions: Transaction[];
  allTransactions: Transaction[];
  period?: {
    from: string | null;
    to: string | null;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  try {
    let date: Date;
    
    // Verificar se a data está no formato brasileiro DD/MM/YYYY
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Assumir formato ISO YYYY-MM-DD
      date = new Date(dateString);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida encontrada:', dateString);
      return dateString; // Retornar string original se não conseguir converter
    }
    
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', dateString, error);
    return dateString;
  }
};

// Função para ordenar transações por data (ordem crescente)
const sortTransactionsByDate = (transactions: Transaction[]): Transaction[] => {
  return [...transactions].sort((a, b) => {
    try {
      let dateA: Date, dateB: Date;
      
      // Converter data A
      if (a.date.includes('/')) {
        const [day, month, year] = a.date.split('/');
        dateA = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        dateA = new Date(a.date);
      }
      
      // Converter data B
      if (b.date.includes('/')) {
        const [day, month, year] = b.date.split('/');
        dateB = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        dateB = new Date(b.date);
      }
      
      // Verificar se as datas são válidas
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0; // Manter ordem original se houver erro
      }
      
      return dateA.getTime() - dateB.getTime(); // Ordem crescente
    } catch (error) {
      console.error('Erro ao comparar datas:', a.date, b.date, error);
      return 0;
    }
  });
};

export const generateDREReport = (data: ReportData) => {
  try {
    console.log('Iniciando geração do PDF com dados:', data);
    
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

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório DRE - Demonstrativo do Resultado do Exercício', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Conta: ${data.selectedAccount}`, margin, yPosition);
    yPosition += 8;
    
    // Adicionar informações do período
    if (data.period && (data.period.from || data.period.to)) {
      let periodText = 'Período: ';
      if (data.period.from && data.period.to) {
        periodText += `${data.period.from} até ${data.period.to}`;
      } else if (data.period.from) {
        periodText += `A partir de ${data.period.from}`;
      } else if (data.period.to) {
        periodText += `Até ${data.period.to}`;
      }
      doc.text(periodText, margin, yPosition);
      yPosition += 8;
    } else {
      doc.text('Período: Todos os períodos', margin, yPosition);
      yPosition += 8;
    }
    
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
    yPosition += 20;

    // Resumo Executivo
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Receitas: ${formatCurrency(data.totalEntries)}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total de Despesas: ${formatCurrency(data.totalExits)}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Resultado Líquido: ${formatCurrency(data.netResult)}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Status: ${data.netResult >= 0 ? 'Superávit' : 'Déficit'}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Transações Categorizadas: ${data.categorizedTransactions.length} de ${data.allTransactions.length}`, margin, yPosition);
    yPosition += 20;

    // Receitas (Entradas)
    if (data.entryCategories && data.entryCategories.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEITAS', margin, yPosition);
      yPosition += 15;

      data.entryCategories.forEach((category) => {
        checkPageBreak(30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${category.name}`, margin, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${formatCurrency(category.total)}`, margin + 10, yPosition);
        yPosition += 6;
        doc.text(`Transações: ${category.transactionCount}`, margin + 10, yPosition);
        yPosition += 6;
        doc.text(`Média: ${formatCurrency(category.transactionCount > 0 ? category.total / category.transactionCount : 0)}`, margin + 10, yPosition);
        yPosition += 6;
        doc.text(`Percentual: ${data.totalEntries > 0 ? ((category.total / data.totalEntries) * 100).toFixed(1) : 0}%`, margin + 10, yPosition);
        yPosition += 12;
      });

      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL DE RECEITAS: ${formatCurrency(data.totalEntries)}`, margin, yPosition);
      yPosition += 20;
    }

    // Despesas (Saídas)
    if (data.exitCategories && data.exitCategories.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DESPESAS', margin, yPosition);
      yPosition += 15;

      data.exitCategories.forEach((category) => {
        checkPageBreak(30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${category.name}`, margin, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${formatCurrency(category.total)}`, margin + 10, yPosition);
        yPosition += 6;
        doc.text(`Transações: ${category.transactionCount}`, margin + 10, yPosition);
        yPosition += 6;
        doc.text(`Média: ${formatCurrency(category.transactionCount > 0 ? category.total / category.transactionCount : 0)}`, margin + 10, yPosition);
        yPosition += 6;
        doc.text(`Percentual: ${data.totalExits > 0 ? ((category.total / data.totalExits) * 100).toFixed(1) : 0}%`, margin + 10, yPosition);
        yPosition += 12;
      });

      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL DE DESPESAS: ${formatCurrency(data.totalExits)}`, margin, yPosition);
      yPosition += 20;
    }

    // Detalhamento das Transações - TODAS AS TRANSAÇÕES ORDENADAS POR DATA
    if (data.categorizedTransactions && data.categorizedTransactions.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DAS TRANSAÇÕES', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`(Mostrando todas as ${data.categorizedTransactions.length} transações)`, margin, yPosition);
      yPosition += 15;

      // Ordenar TODAS as transações por data (ordem crescente)
      const sortedTransactions = sortTransactionsByDate(data.categorizedTransactions);
      
      sortedTransactions.forEach((transaction, index) => {
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${formatDate(transaction.date)} - ${transaction.type.toUpperCase()}`, margin, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Valor: ${formatCurrency(Number(transaction.amount))}`, margin + 10, yPosition);
        yPosition += 5;
        doc.text(`Categoria: ${transaction.category || 'Sem Categoria'}`, margin + 10, yPosition);
        yPosition += 5;
        
        const maxDescLength = 70;
        const description = (transaction.description || '').substring(0, maxDescLength);
        doc.text(`Descrição: ${description}${transaction.description && transaction.description.length > maxDescLength ? '...' : ''}`, margin + 10, yPosition);
        yPosition += 5;
        
        if (transaction.observacao) {
          const maxObsLength = 50;
          const observation = transaction.observacao.substring(0, maxObsLength);
          doc.text(`Observação: ${observation}${transaction.observacao.length > maxObsLength ? '...' : ''}`, margin + 10, yPosition);
          yPosition += 5;
        }
        yPosition += 6;
      });
    }

    // Rodapé com resultado final
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESULTADO FINAL', margin, yPosition);
    yPosition += 20;

    doc.setFontSize(14);
    doc.text(`Total de Receitas: ${formatCurrency(data.totalEntries)}`, margin, yPosition);
    yPosition += 12;
    doc.text(`Total de Despesas: ${formatCurrency(data.totalExits)}`, margin, yPosition);
    yPosition += 12;
    doc.text(`Resultado Líquido: ${formatCurrency(data.netResult)}`, margin, yPosition);
    yPosition += 12;
    doc.text(`Status: ${data.netResult >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}`, margin, yPosition);

    // Salvar o PDF
    let fileName = `DRE_${data.selectedAccount.replace(/\s+/g, '_')}`;
    if (data.period && (data.period.from || data.period.to)) {
      const periodSuffix = data.period.from && data.period.to 
        ? `_${data.period.from.replace(/\//g, '-')}_a_${data.period.to.replace(/\//g, '-')}`
        : data.period.from 
        ? `_a_partir_de_${data.period.from.replace(/\//g, '-')}`
        : `_ate_${data.period.to?.replace(/\//g, '-')}`;
      fileName += periodSuffix;
    }
    fileName += `_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(fileName);
    
    console.log('PDF gerado com sucesso:', fileName);
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};
