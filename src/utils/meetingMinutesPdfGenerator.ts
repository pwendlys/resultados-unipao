
import jsPDF from 'jspdf';
import { SignatureSource } from './meetingSignatureResolver';

export interface MeetingMinutesPdfData {
  title: string;
  minutesText: string;
  reports: { title: string; competencia: string; account_type: string }[];
  diligencias: { description: string; observation: string; reportTitle: string }[];
  signatures: SignatureSource[];
  diligencesSummary?: string;
}

const createMeetingMinutesPDF = (data: MeetingMinutesPdfData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const textWidth = pageWidth - margin * 2;
  let yPos = 30;

  const checkPageBreak = (needed: number) => {
    if (yPos + needed > 270) {
      doc.addPage();
      yPos = 25;
    }
  };

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize('ATA DA REUNIÃO DO CONSELHO FISCAL DA COOPERATIVA UNIPÃO', textWidth);
  doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' });
  yPos += titleLines.length * 7 + 10;

  // Separator
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Minutes text - split by paragraphs
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const minutesContent = (data.minutesText || '').trim();
  console.log(`[MeetingMinutesPDF] minutesText length: ${minutesContent.length}`);

  if (!minutesContent) {
    doc.setTextColor(200, 0, 0);
    doc.text('Texto da ata não disponível.', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  }
  
  const paragraphs = minutesContent.split('\n\n').filter(p => p.trim() && !p.trim().startsWith('ATA DA'));
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    
    const lines = doc.splitTextToSize(trimmed, textWidth);
    for (const line of lines) {
      checkPageBreak(7);
      doc.text(line, margin, yPos);
      yPos += 6;
    }
    yPos += 4;
  }

  // Reports Section
  yPos += 5;
  checkPageBreak(30);
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIOS APROVADOS', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  data.reports.forEach((report, idx) => {
    checkPageBreak(10);
    doc.text(`${idx + 1}. ${report.title} — Competência: ${report.competencia} (${report.account_type})`, margin + 5, yPos);
    yPos += 7;
  });

  // Diligencias Section
  yPos += 5;
  checkPageBreak(30);
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DILIGÊNCIAS CONSOLIDADAS', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (data.diligencias.length === 0) {
    const diligText = data.diligencesSummary
      ? `Resumo das diligências informadas pelo Tesoureiro: ${data.diligencesSummary}`
      : 'Não foram registradas diligências ou divergências relevantes nos relatórios analisados.';
    const diligLines = doc.splitTextToSize(diligText, textWidth - 10);
    doc.text(diligLines, margin + 5, yPos);
    yPos += diligLines.length * 5 + 3;
  } else {
    data.diligencias.forEach((dil, idx) => {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${dil.description.substring(0, 70)}`, margin + 5, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      if (dil.observation) {
        const obsLines = doc.splitTextToSize(`Observação: ${dil.observation}`, textWidth - 10);
        doc.text(obsLines, margin + 10, yPos);
        yPos += obsLines.length * 5;
      }
      doc.text(`Relatório: ${dil.reportTitle}`, margin + 10, yPos);
      yPos += 8;
    });
  }

  // Signatures Section
  doc.addPage();
  yPos = 30;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURAS', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Os participantes abaixo assinam a presente ata, confirmando ciência e aprovação do conteúdo.', margin, yPos);
  yPos += 15;

  // Separator
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Render each signature
  const fiscalSigs = data.signatures.filter(s => s.role === 'fiscal');
  const treasurerSigs = data.signatures.filter(s => s.role === 'tesoureiro');

  // Fiscal signatures
  if (fiscalSigs.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Conselho Fiscal', margin, yPos);
    yPos += 10;

    for (const sig of fiscalSigs) {
      checkPageBreak(70);
      renderSignature(doc, sig, margin, yPos, pageWidth);
      yPos += 70;
    }
  }

  // Treasurer signatures
  if (treasurerSigs.length > 0) {
    checkPageBreak(80);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tesouraria', margin, yPos);
    yPos += 10;

    for (const sig of treasurerSigs) {
      checkPageBreak(70);
      renderSignature(doc, sig, margin, yPos, pageWidth);
      yPos += 70;
    }
  }

  return doc;
};

const normalizeSignatureData = (payload: string): string => {
  if (!payload || !payload.trim()) {
    console.warn('[MeetingMinutesPDF] Empty signature payload');
    return '';
  }
  const trimmed = payload.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;
  console.log('[MeetingMinutesPDF] Adding data:image prefix to raw base64, length:', trimmed.length);
  return `data:image/png;base64,${trimmed}`;
};

const getImageFormat = (dataUrl: string): string => {
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  return 'PNG';
};

const renderSignature = (doc: jsPDF, sig: SignatureSource, margin: number, yPos: number, pageWidth: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(sig.displayName, margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const roleText = sig.role === 'tesoureiro' ? 'Tesoureiro(a)' : 'Conselheiro(a) Fiscal';
  doc.text(roleText, margin, yPos);
  yPos += 5;

  if (sig.signedAtOriginal) {
    const sigDate = new Date(sig.signedAtOriginal);
    const formattedDate = sigDate.toLocaleDateString('pt-BR');
    const formattedTime = sigDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Assinatura registrada em ${formattedDate} às ${formattedTime}`, margin, yPos);
  }
  yPos += 8;

  try {
    if (sig.signaturePayload) {
      const normalizedPayload = normalizeSignatureData(sig.signaturePayload);
      console.log(`[MeetingMinutesPDF] Rendering signature for ${sig.displayName} (${sig.role}), payload length: ${normalizedPayload.length}`);
      if (normalizedPayload && normalizedPayload.length > 100) {
        const imgFormat = getImageFormat(normalizedPayload);
        doc.addImage(normalizedPayload, imgFormat, margin, yPos, 120, 50);
        yPos += 53;
      } else {
        doc.text('[Assinatura registrada no sistema]', margin, yPos);
        yPos += 8;
      }
    }
  } catch (error) {
    console.error('Error adding signature image:', error);
    doc.text('[Assinatura não pôde ser renderizada]', margin, yPos);
    yPos += 8;
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Assinatura eletrônica válida conforme registro no sistema', margin, yPos);
  doc.setTextColor(0, 0, 0);

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
};

export const generateMeetingMinutesPDF = (data: MeetingMinutesPdfData): void => {
  const doc = createMeetingMinutesPDF(data);
  doc.save(`ata_conselho_fiscal_${Date.now()}.pdf`);
};

export const generateMeetingMinutesPDFBlob = async (data: MeetingMinutesPdfData): Promise<Blob> => {
  const doc = createMeetingMinutesPDF(data);
  return doc.output('blob');
};
