import jsPDF from 'jspdf';
import { FiscalReport } from '@/hooks/useFiscalReports';
import { FiscalReview } from '@/hooks/useFiscalReviews';

export const generateFiscalPDF = (report: FiscalReport, reviews: FiscalReview[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO PARA CONFERÊNCIA DO CONSELHO FISCAL', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Extrato: ${report.title}`, 14, yPos);
  yPos += 6;
  doc.text(`Competência: ${report.competencia} | Conta: ${report.account_type}`, 14, yPos);
  yPos += 6;
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos);
  
  // Stats
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${reviews.length} | Aprovados: ${report.approved_count} | Divergentes: ${report.flagged_count} | Pendentes: ${report.pending_count}`, 14, yPos);

  // Table Header
  yPos += 12;
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos - 4, pageWidth - 28, 8, 'F');
  doc.setFontSize(8);
  doc.text('#', 16, yPos);
  doc.text('Data', 26, yPos);
  doc.text('Descrição', 50, yPos);
  doc.text('Valor', 130, yPos);
  doc.text('Status', 160, yPos);
  doc.text('Obs', 180, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');

  // Reviews ordered by entry_index
  const sortedReviews = [...reviews].sort((a, b) => a.entry_index - b.entry_index);

  sortedReviews.forEach((review) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const transaction = review.transaction;
    const statusText = review.status === 'approved' ? 'OK' : 
                       review.status === 'flagged' ? 'DIV' : 'PEND';

    doc.text(String(review.entry_index), 16, yPos);
    doc.text(transaction?.date || '-', 26, yPos);
    
    const desc = (transaction?.description || '-').substring(0, 45);
    doc.text(desc, 50, yPos);
    
    const amount = transaction?.amount || 0;
    const amountStr = `${transaction?.type === 'saida' ? '-' : ''}R$ ${amount.toFixed(2)}`;
    doc.text(amountStr, 130, yPos);
    
    doc.text(statusText, 160, yPos);
    
    if (review.observation) {
      doc.text('Sim', 180, yPos);
    }

    yPos += 6;

    // Show observation if flagged
    if (review.observation) {
      doc.setFontSize(7);
      doc.setTextColor(150, 0, 0);
      doc.text(`   → ${review.observation.substring(0, 80)}`, 50, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      yPos += 5;
    }
  });

  doc.save(`fiscal_${report.competencia}_${Date.now()}.pdf`);
};
