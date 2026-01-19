import jsPDF from 'jspdf';
import { FiscalReport } from '@/hooks/useFiscalReports';
import { FiscalReview } from '@/hooks/useFiscalReviews';
import { FiscalSignature } from '@/hooks/useFiscalSignatures';
import { TransactionDiligenceInfo } from '@/hooks/useFiscalUserReviews';

// Internal function that generates the PDF document
const createFiscalPDFDocument = (
  report: FiscalReport, 
  reviews: FiscalReview[],
  signatures?: FiscalSignature[],
  diligenceStatus?: Record<string, TransactionDiligenceInfo>
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
  
  // Count diligences
  const diligenceCount = diligenceStatus 
    ? Object.values(diligenceStatus).filter(d => d.isDiligence).length 
    : 0;

  // Stats
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${reviews.length} | Aprovados: ${report.approved_count} | Diligências: ${diligenceCount} | Pendentes: ${report.pending_count}`, 14, yPos);

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
    const txDiligence = diligenceStatus?.[review.transaction_id];
    
    // Determine status text
    let statusText = review.status === 'approved' ? 'OK' : 
                     review.status === 'flagged' ? 'DIV' : 'PEND';
    
    // Override with diligence status if applicable
    if (txDiligence?.isDiligence) {
      statusText = `DIL ${txDiligence.ackCount}/3`;
    }

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

  // Diligences section - if there are any diligences
  const diligentTransactions = diligenceStatus 
    ? Object.entries(diligenceStatus).filter(([_, d]) => d.isDiligence)
    : [];

  if (diligentTransactions.length > 0 && signatures && signatures.length >= 3) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DILIGÊNCIAS REGISTRADAS', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('As seguintes transações foram objeto de análise com apontamentos pelo Conselho Fiscal:', 14, yPos);
    
    yPos += 10;
    
    diligentTransactions.forEach(([txId, diligenceInfo], index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      // Find the review for this transaction
      const review = reviews.find(r => r.transaction_id === txId);
      if (!review) return;

      const transaction = review.transaction;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${transaction?.date || '-'} - ${(transaction?.description || '-').substring(0, 60)}`, 14, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      const amount = transaction?.amount || 0;
      const amountStr = `${transaction?.type === 'saida' ? '-' : ''}R$ ${amount.toFixed(2)}`;
      doc.text(`   Valor: ${amountStr} | Confirmação: ${diligenceInfo.ackCount}/3`, 14, yPos);
      yPos += 5;
      
      if (diligenceInfo.divergentObservation) {
        doc.setTextColor(150, 80, 0);
        const obsLines = doc.splitTextToSize(`   Observação: ${diligenceInfo.divergentObservation}`, pageWidth - 28);
        doc.text(obsLines, 14, yPos);
        yPos += obsLines.length * 4;
        doc.setTextColor(0, 0, 0);
      }
      
      yPos += 8;
    });
    
    // Visual separator
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 10;
  }

  // Signatures section - ONLY if report is concluded (3+ signatures)
  if (signatures && signatures.length >= 3) {
    doc.addPage();
    yPos = 20;
    
    // Formal section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO DE CIÊNCIA E APROVAÇÃO DO CONSELHO FISCAL', pageWidth / 2, yPos, { align: 'center' });
    
    // Institutional declaration text
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const declarationText = `Declaramos, para os devidos fins, que o presente relatório financeiro referente à competência ${report.competencia} foi devidamente analisado, conferido e revisado pelos membros do Conselho Fiscal da Cooperativa Unipão, conforme as assinaturas abaixo, estando em conformidade com os registros contábeis e documentação comprobatória apresentada.`;
    
    const declarationLines = doc.splitTextToSize(declarationText, pageWidth - 28);
    doc.text(declarationLines, 14, yPos);
    yPos += declarationLines.length * 5 + 15;
    
    // Visual separator
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 20;

    // Signatures list
    signatures.forEach((sig) => {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      // Fiscal name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(sig.display_name || 'Nome não informado', 14, yPos);
      yPos += 6;
      
      // Title/Role
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Conselheiro(a) Fiscal', 14, yPos);
      yPos += 5;
      
      // Signature date/time
      const signatureDate = new Date(sig.created_at);
      const formattedDate = signatureDate.toLocaleDateString('pt-BR');
      const formattedTime = signatureDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      doc.text(`Assinado eletronicamente em ${formattedDate} às ${formattedTime}`, 14, yPos);
      yPos += 10;

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
      
      // Validity indicator
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Assinatura eletrônica válida conforme registro no sistema', 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      // Separator between signatures
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 15;
    });
  }

  return doc;
};

// Main function that saves the PDF file
export const generateFiscalPDF = (
  report: FiscalReport, 
  reviews: FiscalReview[],
  signatures?: FiscalSignature[],
  diligenceStatus?: Record<string, TransactionDiligenceInfo>
) => {
  const doc = createFiscalPDFDocument(report, reviews, signatures, diligenceStatus);
  doc.save(`fiscal_${report.competencia}_${Date.now()}.pdf`);
};

// Function that returns PDF as Blob for upload
export const generateFiscalPDFBlob = async (
  report: FiscalReport, 
  reviews: FiscalReview[],
  signatures?: FiscalSignature[],
  diligenceStatus?: Record<string, TransactionDiligenceInfo>
): Promise<Blob> => {
  const doc = createFiscalPDFDocument(report, reviews, signatures, diligenceStatus);
  return doc.output('blob');
};
