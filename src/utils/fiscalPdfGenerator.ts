import jsPDF from 'jspdf';
import { FiscalReport } from '@/hooks/useFiscalReports';
import { FiscalReview } from '@/hooks/useFiscalReviews';
import { FiscalSignature } from '@/hooks/useFiscalSignatures';
import { TransactionDiligenceInfo } from '@/hooks/useFiscalUserReviews';
import { TreasurerSignature } from '@/hooks/useTreasurerSignature';

// Internal function that generates the PDF document
const createFiscalPDFDocument = (
  report: FiscalReport, 
  reviews: FiscalReview[],
  signatures?: FiscalSignature[],
  diligenceStatus?: Record<string, TransactionDiligenceInfo>,
  treasurerSignature?: TreasurerSignature
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

  // Reviews ordered by entry_index (original order from statement)
  const sortedReviews = [...reviews].sort((a, b) => a.entry_index - b.entry_index);

  sortedReviews.forEach((review) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    const transaction = review.transaction;
    const txDiligence = diligenceStatus?.[review.transaction_id];
    const isDiligence = txDiligence?.isDiligence;
    
    // Determine status text
    let statusText = review.status === 'approved' ? 'OK' : 
                     review.status === 'flagged' ? 'DIV' : 'PEND';
    
    // Override with diligence status if applicable
    if (isDiligence) {
      statusText = `DIL ${txDiligence.ackCount}/3`;
    }

    // Draw diligence badge background if applicable
    if (isDiligence) {
      doc.setFillColor(255, 243, 205); // Light amber
      doc.rect(14, yPos - 4, pageWidth - 28, 6, 'F');
    }

    doc.setTextColor(0, 0, 0);
    doc.text(String(review.entry_index), 16, yPos);
    doc.text(transaction?.date || '-', 26, yPos);
    
    // Add DILIGÊNCIA badge inline if applicable
    let desc = transaction?.description || '-';
    if (isDiligence) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 100, 0);
      doc.text('[DIL]', 50, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      desc = desc.substring(0, 40);
      doc.text(desc, 62, yPos);
    } else {
      desc = desc.substring(0, 45);
      doc.text(desc, 50, yPos);
    }
    
    const amount = transaction?.amount || 0;
    const amountStr = `${transaction?.type === 'saida' ? '-' : ''}R$ ${amount.toFixed(2)}`;
    doc.text(amountStr, 130, yPos);
    
    doc.text(statusText, 160, yPos);
    
    if (review.observation) {
      doc.text('Sim', 180, yPos);
    }

    yPos += 6;

    // Show diligence details if applicable
    if (isDiligence && txDiligence) {
      doc.setFontSize(7);
      doc.setTextColor(150, 80, 0);
      
      // Diligence reason
      if (txDiligence.divergentObservation) {
        doc.text(`   Motivo: ${txDiligence.divergentObservation.substring(0, 70)}`, 16, yPos);
        yPos += 4;
      }
      
      // Who marked it
      if (txDiligence.diligenceCreatorName || txDiligence.diligenceCreatedBy) {
        const creatorName = txDiligence.diligenceCreatorName || txDiligence.diligenceCreatedBy || '-';
        const createdDate = txDiligence.diligenceCreatedAt ? new Date(txDiligence.diligenceCreatedAt).toLocaleDateString('pt-BR') : '-';
        doc.text(`   Marcado por: ${creatorName} em ${createdDate}`, 16, yPos);
        yPos += 4;
      }
      
      // Acknowledgment status
      doc.text(`   Ciência: ${txDiligence.ackCount}/3 ${txDiligence.ackCount >= 3 ? '✓ Confirmada' : ''}`, 16, yPos);
      yPos += 5;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
    }

    // Show observation if flagged (and not already shown as diligence)
    if (review.observation && !isDiligence) {
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

  // Signatures section - ONLY if report has 3+ fiscal signatures AND treasurer signature (4 total)
  const hasAllSignatures = signatures && signatures.length >= 3 && treasurerSignature;
  
  if (hasAllSignatures) {
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
    
    const declarationText = `Declaramos, para os devidos fins, que realizamos a conferência e revisão das transações constantes neste relatório financeiro referente à competência ${report.competencia}, incluindo eventuais diligências registradas, dando ciência e validando as informações apresentadas. Este documento foi analisado e aprovado pelos membros do Conselho Fiscal e pelo(a) Tesoureiro(a) da Cooperativa Unipão, conforme as assinaturas abaixo.`;
    
    const declarationLines = doc.splitTextToSize(declarationText, pageWidth - 28);
    doc.text(declarationLines, 14, yPos);
    yPos += declarationLines.length * 5 + 15;
    
    // Visual separator
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 20;

    // Fiscal Signatures (3)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Conselho Fiscal', 14, yPos);
    yPos += 10;

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

    // Treasurer Signature
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Tesouraria', 14, yPos);
    yPos += 10;

    // Treasurer name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(treasurerSignature.display_name || 'Nome não informado', 14, yPos);
    yPos += 6;
    
    // Title/Role
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Tesoureiro(a)', 14, yPos);
    yPos += 5;
    
    // Signature date/time
    const treasurerDate = new Date(treasurerSignature.signed_at);
    const formattedTreasurerDate = treasurerDate.toLocaleDateString('pt-BR');
    const formattedTreasurerTime = treasurerDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Assinado eletronicamente em ${formattedTreasurerDate} às ${formattedTreasurerTime}`, 14, yPos);
    yPos += 10;

    // Draw treasurer signature image
    try {
      if (treasurerSignature.signature_data && treasurerSignature.signature_data.startsWith('data:image')) {
        doc.addImage(treasurerSignature.signature_data, 'PNG', 14, yPos, 80, 40);
        yPos += 45;
      }
    } catch (error) {
      console.error('Error adding treasurer signature image:', error);
      doc.text('[Assinatura não pôde ser renderizada]', 14, yPos);
      yPos += 10;
    }
    
    // Validity indicator
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Assinatura eletrônica válida conforme registro no sistema', 14, yPos);
    doc.setTextColor(0, 0, 0);
  }

  return doc;
};

// Main function that saves the PDF file
export const generateFiscalPDF = (
  report: FiscalReport, 
  reviews: FiscalReview[],
  signatures?: FiscalSignature[],
  diligenceStatus?: Record<string, TransactionDiligenceInfo>,
  treasurerSignature?: TreasurerSignature
) => {
  const doc = createFiscalPDFDocument(report, reviews, signatures, diligenceStatus, treasurerSignature);
  doc.save(`fiscal_${report.competencia}_${Date.now()}.pdf`);
};

// Function that returns PDF as Blob for upload
export const generateFiscalPDFBlob = async (
  report: FiscalReport, 
  reviews: FiscalReview[],
  signatures?: FiscalSignature[],
  diligenceStatus?: Record<string, TransactionDiligenceInfo>,
  treasurerSignature?: TreasurerSignature
): Promise<Blob> => {
  const doc = createFiscalPDFDocument(report, reviews, signatures, diligenceStatus, treasurerSignature);
  return doc.output('blob');
};
