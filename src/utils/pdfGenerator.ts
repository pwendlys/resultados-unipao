
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
    yPosition += 10;
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

    // Detalhamento das Transações
    if (data.categorizedTransactions && data.categorizedTransactions.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DAS TRANSAÇÕES', margin, yPosition);
      yPosition += 15;

      // Agrupar transações por categoria
      const transactionsByCategory = data.categorizedTransactions.reduce((acc, transaction) => {
        const category = transaction.category || 'Sem Categoria';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(transaction);
        return acc;
      }, {} as Record<string, Transaction[]>);

      Object.entries(transactionsByCategory).forEach(([categoryName, transactions]) => {
        checkPageBreak(25);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Categoria: ${categoryName}`, margin, yPosition);
        yPosition += 10;

        transactions.forEach((transaction) => {
          checkPageBreak(20);
          doc.setFont('helvetica', 'normal');
          doc.text(`Data: ${formatDate(transaction.date)}`, margin + 10, yPosition);
          yPosition += 6;
          doc.text(`Descrição: ${(transaction.description || '').substring(0, 60)}${transaction.description && transaction.description.length > 60 ? '...' : ''}`, margin + 10, yPosition);
          yPosition += 6;
          doc.text(`Valor: ${formatCurrency(Number(transaction.amount))} (${transaction.type})`, margin + 10, yPosition);
          yPosition += 6;
          if (transaction.observacao) {
            doc.text(`Observação: ${transaction.observacao.substring(0, 60)}${transaction.observacao.length > 60 ? '...' : ''}`, margin + 10, yPosition);
            yPosition += 6;
          }
          yPosition += 8;
        });
        yPosition += 10;
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
    const fileName = `DRE_${data.selectedAccount.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('PDF gerado com sucesso:', fileName);
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};
