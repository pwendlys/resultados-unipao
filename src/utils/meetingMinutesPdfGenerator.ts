
import jsPDF from 'jspdf';
import { SignatureSource } from './meetingSignatureResolver';
import unipaoLogoUrl from '@/assets/unipao-logo.png';

export interface MeetingMinutesPdfData {
  title: string;
  minutesText: string;
  reports: { title: string; competencia: string; account_type: string }[];
  diligencias: { description: string; observation: string; reportTitle: string }[];
  signatures: SignatureSource[];
  diligencesSummary?: string;
}

/* ─── helpers ─── */

const loadImageAsBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const normalizeSignatureData = (payload: string): string => {
  if (!payload || !payload.trim()) return '';
  const trimmed = payload.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;
  return `data:image/png;base64,${trimmed}`;
};

const getImageFormat = (dataUrl: string): string => {
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  return 'PNG';
};

/* ─── page helpers ─── */

const PAGE_HEIGHT = 297; // A4mm
const MARGIN = 20;
const TEXT_WIDTH_MM = 210 - MARGIN * 2; // 170mm
const BOTTOM_LIMIT = PAGE_HEIGHT - 25;

const ensureSpace = (doc: jsPDF, yPos: number, needed: number): number => {
  if (yPos + needed > BOTTOM_LIMIT) {
    doc.addPage();
    return 25;
  }
  return yPos;
};

/* ─── cover page ─── */

const renderCoverPage = (doc: jsPDF, data: MeetingMinutesPdfData, logoBase64: string | null) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 50;

  // Logo
  if (logoBase64) {
    try {
      const logoW = 60;
      const logoH = 60;
      doc.addImage(logoBase64, 'PNG', (pageWidth - logoW) / 2, y, logoW, logoH);
      y += logoH + 15;
    } catch (e) {
      console.error('[MeetingMinutesPDF] Logo error:', e);
      y += 15;
    }
  }

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ATA DO CONSELHO FISCAL', pageWidth / 2, y, { align: 'center' });
  y += 12;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Cooperativa Unipão', pageWidth / 2, y, { align: 'center' });
  y += 20;

  // Separator
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.8);
  doc.line(MARGIN + 30, y, pageWidth - MARGIN - 30, y);
  y += 18;

  // Meeting info from title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  const titleLines = doc.splitTextToSize(data.title, TEXT_WIDTH_MM - 20);
  for (const line of titleLines) {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 7;
  }
};

/* ─── text section ─── */

const renderMinutesText = (doc: jsPDF, minutesText: string): number => {
  doc.addPage();
  let y = 25;

  // Section title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TEXTO DA ATA', MARGIN, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Split into paragraphs: handle \n\n as paragraph break, single \n as line break within paragraph
  const rawParagraphs = minutesText.split(/\n\s*\n/);

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Each paragraph may contain single \n — treat them as soft line breaks
    const subLines = trimmed.split('\n');
    for (const subLine of subLines) {
      const wrapped = doc.splitTextToSize(subLine.trim(), TEXT_WIDTH_MM);
      for (const wLine of wrapped) {
        y = ensureSpace(doc, y, 7);
        doc.text(wLine, MARGIN, y);
        y += 6;
      }
    }
    // Extra space between paragraphs
    y += 4;
  }

  return y;
};

/* ─── reports section ─── */

const renderReports = (doc: jsPDF, reports: MeetingMinutesPdfData['reports'], yPos: number): number => {
  let y = yPos + 5;
  y = ensureSpace(doc, y, 25);

  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, 210 - MARGIN, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIOS APROVADOS', MARGIN, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  reports.forEach((report, idx) => {
    y = ensureSpace(doc, y, 10);
    const text = `${idx + 1}. ${report.title} — Competência: ${report.competencia} (${report.account_type})`;
    const lines = doc.splitTextToSize(text, TEXT_WIDTH_MM - 5);
    for (const line of lines) {
      y = ensureSpace(doc, y, 7);
      doc.text(line, MARGIN + 5, y);
      y += 6;
    }
    y += 2;
  });

  return y;
};

/* ─── diligencias section ─── */

const renderDiligencias = (doc: jsPDF, data: MeetingMinutesPdfData, yPos: number): number => {
  let y = yPos + 5;
  y = ensureSpace(doc, y, 25);

  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, 210 - MARGIN, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DILIGÊNCIAS CONSOLIDADAS', MARGIN, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (data.diligencias.length === 0) {
    const diligText = data.diligencesSummary
      ? `Resumo das diligências informadas pelo Tesoureiro: ${data.diligencesSummary}`
      : 'Não foram registradas diligências ou divergências relevantes nos relatórios analisados.';
    const lines = doc.splitTextToSize(diligText, TEXT_WIDTH_MM - 10);
    for (const line of lines) {
      y = ensureSpace(doc, y, 7);
      doc.text(line, MARGIN + 5, y);
      y += 5;
    }
    y += 3;
  } else {
    data.diligencias.forEach((dil, idx) => {
      y = ensureSpace(doc, y, 20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${dil.description.substring(0, 70)}`, MARGIN + 5, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      if (dil.observation) {
        const obsLines = doc.splitTextToSize(`Observação: ${dil.observation}`, TEXT_WIDTH_MM - 10);
        for (const line of obsLines) {
          y = ensureSpace(doc, y, 6);
          doc.text(line, MARGIN + 10, y);
          y += 5;
        }
      }
      y = ensureSpace(doc, y, 7);
      doc.text(`Relatório: ${dil.reportTitle}`, MARGIN + 10, y);
      y += 8;
    });
  }

  return y;
};

/* ─── signatures section ─── */

const renderSignature = (doc: jsPDF, sig: SignatureSource, margin: number, yPos: number, pageWidth: number): number => {
  let y = yPos;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(sig.displayName, margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const roleText = sig.role === 'tesoureiro' ? 'Tesoureiro(a)' : 'Conselheiro(a) Fiscal';
  doc.text(roleText, margin, y);
  y += 5;

  if (sig.signedAtOriginal) {
    const sigDate = new Date(sig.signedAtOriginal);
    const formattedDate = sigDate.toLocaleDateString('pt-BR');
    const formattedTime = sigDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Assinatura registrada em ${formattedDate} às ${formattedTime}`, margin, y);
  }
  y += 8;

  try {
    if (sig.signaturePayload) {
      const normalizedPayload = normalizeSignatureData(sig.signaturePayload);
      if (normalizedPayload && normalizedPayload.length > 100) {
        const imgFormat = getImageFormat(normalizedPayload);
        doc.addImage(normalizedPayload, imgFormat, margin, y, 120, 50);
        y += 53;
      } else {
        doc.text('[Assinatura registrada no sistema]', margin, y);
        y += 8;
      }
    }
  } catch (error) {
    console.error('Error adding signature image:', error);
    doc.text('[Assinatura não pôde ser renderizada]', margin, y);
    y += 8;
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Assinatura eletrônica válida conforme registro no sistema', margin, y);
  doc.setTextColor(0, 0, 0);
  y += 3;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 5, pageWidth - margin, y + 5);
  y += 10;

  return y;
};

const renderSignatures = (doc: jsPDF, signatures: SignatureSource[]) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.addPage();
  let y = 30;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURAS', pageWidth / 2, y, { align: 'center' });
  y += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Os participantes abaixo assinam a presente ata, confirmando ciência e aprovação do conteúdo.', MARGIN, y);
  y += 15;

  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 15;

  const fiscalSigs = signatures.filter(s => s.role === 'fiscal');
  const treasurerSigs = signatures.filter(s => s.role === 'tesoureiro');

  if (fiscalSigs.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Conselho Fiscal', MARGIN, y);
    y += 10;

    for (const sig of fiscalSigs) {
      y = ensureSpace(doc, y, 70);
      y = renderSignature(doc, sig, MARGIN, y, pageWidth);
    }
  }

  if (treasurerSigs.length > 0) {
    y = ensureSpace(doc, y, 80);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tesouraria', MARGIN, y);
    y += 10;

    for (const sig of treasurerSigs) {
      y = ensureSpace(doc, y, 70);
      y = renderSignature(doc, sig, MARGIN, y, pageWidth);
    }
  }
};

/* ─── main ─── */

const createMeetingMinutesPDF = async (data: MeetingMinutesPdfData): Promise<jsPDF> => {
  const minutesContent = (data.minutesText || '').trim();
  console.log(`[MeetingMinutesPDF] minutesText length: ${minutesContent.length}`);

  if (minutesContent.length < 50) {
    throw new Error(`Texto da Ata está vazio ou muito curto (${minutesContent.length} caracteres) — não é possível gerar o PDF.`);
  }

  // Load logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64(unipaoLogoUrl);
  } catch (e) {
    console.warn('[MeetingMinutesPDF] Could not load logo:', e);
  }

  const doc = new jsPDF();

  // Page 1: Cover
  renderCoverPage(doc, data, logoBase64);

  // Page 2+: Minutes text
  let y = renderMinutesText(doc, minutesContent);

  // Reports
  y = renderReports(doc, data.reports, y);

  // Diligencias
  y = renderDiligencias(doc, data, y);

  // Signatures (always new page)
  renderSignatures(doc, data.signatures);

  return doc;
};

export const generateMeetingMinutesPDF = async (data: MeetingMinutesPdfData): Promise<void> => {
  const doc = await createMeetingMinutesPDF(data);
  doc.save(`ata_conselho_fiscal_${Date.now()}.pdf`);
};

export const generateMeetingMinutesPDFBlob = async (data: MeetingMinutesPdfData): Promise<Blob> => {
  const doc = await createMeetingMinutesPDF(data);
  return doc.output('blob');
};
