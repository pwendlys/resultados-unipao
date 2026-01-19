import jsPDF from 'jspdf';
import { FiscalReport } from '@/hooks/useFiscalReports';
import { FiscalReview } from '@/hooks/useFiscalReviews';
import { FiscalSignature } from '@/hooks/useFiscalSignatures';

export const generateFiscalPDF = (
  report: FiscalReport, 
  reviews: FiscalReview[],
  signatures?: FiscalSignature[]
) => {
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

  // Reviews ordered by status (pending > flagged > approved) then by entry_index
  const sortedReviews = [...reviews].sort((a, b) => {
    const statusOrder: Record<string, number> = { pending: 0, flagged: 1, approved: 2 };
    const statusDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
    if (statusDiff !== 0) return statusDiff;
    return a.entry_index - b.entry_index;
  });

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

  // Signatures section (only if signatures exist)
  if (signatures && signatures.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURAS DO CONSELHO FISCAL', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de assinaturas: ${signatures.length}`, 14, yPos);
    
    yPos += 15;

    signatures.forEach((sig, index) => {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      // Signature header
      doc.setFont('helvetica', 'bold');
      doc.text(`Assinatura ${index + 1}`, 14, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${sig.display_name || 'Não informado'}`, 14, yPos);
      yPos += 5;
      doc.text(`Data/Hora: ${new Date(sig.created_at).toLocaleString('pt-BR')}`, 14, yPos);
      yPos += 8;

      // Draw signature image
      try {
        if (sig.signature_data && sig.signature_data.startsWith('data:image')) {
          doc.addImage(sig.signature_data, 'PNG', 14, yPos, 80, 40);
          yPos += 45;
        }
      } catch (error) {
        console.error('Error adding signature image:', error);
        doc.text('[Assinatura não pôde ser renderizada]', 14, yPos);
        yPos += 10;
      }

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 10;
    });
  }

  doc.save(`fiscal_${report.competencia}_${Date.now()}.pdf`);
};
