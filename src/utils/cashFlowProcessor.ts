import * as XLSX from 'xlsx';
import { ProcessedFinancialData } from './financialProcessor';

interface CashFlowItem {
  data: string;
  saldo_dia: number;
  a_pagar: number;
  a_receber: number;
  saldo_final: number;
  situacao: string;
}

export const processCashFlowXLSX = async (file: File, periodo: string): Promise<ProcessedFinancialData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log('[DEBUG] Iniciando processamento de fluxo de caixa para arquivo:', file.name);
        
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        console.log('[DEBUG] Dados extraídos da planilha:', jsonData.slice(0, 5)); // Primeiras 5 linhas

        if (jsonData.length < 2) {
          throw new Error('Planilha deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
        }

        const cashFlowItems = processCashFlowData(jsonData);
        console.log('[DEBUG] Itens de fluxo de caixa processados:', cashFlowItems);
        
        const valorTotal = cashFlowItems.reduce((sum, item) => sum + Math.abs(item.a_pagar - item.a_receber), 0);

        // Converter itens de fluxo de caixa para formato de itens financeiros
        const itens = cashFlowItems.map((item, index) => {
          const dataVencimento = formatDateToISO(item.data);
          const dataEmissao = formatDateToISO(item.data);
          
          console.log(`[DEBUG] Processando item ${index + 1}:`, {
            data_original: item.data,
            data_vencimento: dataVencimento,
            data_emissao: dataEmissao,
            valor: Math.abs(item.a_pagar - item.a_receber)
          });

          return {
            descricao: `Fluxo de Caixa - ${formatDate(item.data) || `Dia ${index + 1}`}`,
            valor: Math.abs(item.a_pagar - item.a_receber),
            data_vencimento: dataVencimento || new Date().toISOString().split('T')[0], // Fallback para hoje
            data_emissao: dataEmissao || new Date().toISOString().split('T')[0], // Fallback para hoje
            numero_documento: `FC-${index + 1}`,
            categoria: `Fluxo de Caixa - ${item.situacao}`,
            status: 'pendente' as const,
            juros: 0,
            multa: 0,
            observacao: JSON.stringify({
              saldo_dia: item.saldo_dia,
              a_pagar: item.a_pagar,
              a_receber: item.a_receber,
              saldo_final: item.saldo_final,
              situacao: item.situacao,
              tipo_fluxo: 'diario'
            })
          };
        });

        console.log('[DEBUG] Itens finais formatados para inserção:', itens);

        const documento = {
          nome: file.name,
          tipo_documento: 'fluxo_caixa' as any,
          arquivo_original: file.name,
          periodo,
          valor_total: valorTotal,
          quantidade_documentos: itens.length,
          status: 'processado',
          observacoes: 'Documento de Fluxo de Caixa Diário'
        };

        console.log('[DEBUG] Documento criado:', documento);

        resolve({ documento, itens });
      } catch (error) {
        console.error('[DEBUG] Erro durante processamento de fluxo de caixa:', error);
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
};

const processCashFlowData = (jsonData: any[][]): CashFlowItem[] => {
  const items: CashFlowItem[] = [];
  let headerRowIndex = -1;
  let dateCol = -1, saldoDiaCol = -1, aPagarCol = -1, aReceberCol = -1, saldoCol = -1, situacaoCol = -1;

  // Encontrar linha de cabeçalho
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && row.length >= 4) {
      const headers = row.map(cell => String(cell || '').toLowerCase().trim());
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (header.includes('data') || header.includes('date')) {
          dateCol = j;
        }
        if (header.includes('saldo') && header.includes('dia')) {
          saldoDiaCol = j;
        }
        if (header.includes('pagar') || header.includes('saída')) {
          aPagarCol = j;
        }
        if (header.includes('receber') || header.includes('entrada')) {
          aReceberCol = j;
        }
        if (header.includes('saldo') && !header.includes('dia')) {
          saldoCol = j;
        }
        if (header.includes('situação') || header.includes('situacao')) {
          situacaoCol = j;
        }
      }

      // Se encontrou pelo menos data, a pagar e a receber
      if (dateCol >= 0 && aPagarCol >= 0 && aReceberCol >= 0) {
        headerRowIndex = i + 1;
        break;
      }
    }
  }

  // Se não encontrou header específico, assumir posições padrão baseadas na imagem
  if (headerRowIndex === -1) {
    // Formato esperado: DATA | SALDO DO DIA | A PAGAR | A RECEBER | SALDO | SITUAÇÃO
    dateCol = 0;
    saldoDiaCol = 1;
    aPagarCol = 2;
    aReceberCol = 3;
    saldoCol = 4;
    situacaoCol = 5;
    
    // Procurar primeira linha com dados válidos
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.length >= 4) {
        const dateStr = String(row[0] || '').trim();
        if (dateStr && (dateStr.includes('/') || dateStr.match(/\d{2}\/\d{2}\/\d{4}/))) {
          headerRowIndex = i;
          break;
        }
      }
    }
  }

  // Processar dados
  if (headerRowIndex >= 0) {
    for (let i = headerRowIndex; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      if (row && row.length > Math.max(dateCol, aPagarCol, aReceberCol)) {
        const dataStr = String(row[dateCol] || '').trim();
        const saldoDiaStr = String(row[saldoDiaCol] || '0').trim();
        const aPagarStr = String(row[aPagarCol] || '0').trim();
        const aReceberStr = String(row[aReceberCol] || '0').trim();
        const saldoStr = String(row[saldoCol] || '0').trim();
        const situacao = String(row[situacaoCol] || 'Normal').trim();

        // Pular linhas vazias
        if (!dataStr || dataStr.length < 2) continue;

        // Converter valores
        const saldoDia = parseFloat(saldoDiaStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
        const aPagar = parseFloat(aPagarStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
        const aReceber = parseFloat(aReceberStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
        const saldoFinal = parseFloat(saldoStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || (saldoDia + aReceber - aPagar);

        items.push({
          data: dataStr,
          saldo_dia: saldoDia,
          a_pagar: aPagar,
          a_receber: aReceber,
          saldo_final: saldoFinal,
          situacao: situacao || 'Normal'
        });
      }
    }
  }

  return items;
};

const formatDate = (dateStr: string): string => {
  try {
    // Tentar diferentes formatos
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }

    // Formato brasileiro (dd/mm/yyyy)
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  } catch {
    return dateStr;
  }
};

const formatDateToISO = (dateStr: string): string | undefined => {
  try {
    // Tentar diferentes formatos
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // Formato brasileiro (dd/mm/yyyy)
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
};

// Função para gerar modelo de fluxo de caixa
export const downloadCashFlowSampleXLSX = () => {
  const data = [
    ['DATA', 'SALDO DO DIA', 'A PAGAR', 'A RECEBER', 'SALDO', 'SITUAÇÃO'],
    ['01/12/2024', 10000.00, 2500.00, 3000.00, 10500.00, 'PREV'],
    ['02/12/2024', 10500.00, 1800.00, 2200.00, 10900.00, 'PREV'],
    ['03/12/2024', 10900.00, 3200.00, 1500.00, 9200.00, 'PREV + OVOS'],
    ['04/12/2024', 9200.00, 2100.00, 4000.00, 11100.00, 'REAL'],
    ['05/12/2024', 11100.00, 2800.00, 2500.00, 10800.00, 'REAL']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa');
  XLSX.writeFile(wb, 'modelo_fluxo_caixa.xlsx');
};

export const isCashFlowFile = (jsonData: any[][]): boolean => {
  // Detectar se é arquivo de fluxo de caixa baseado no conteúdo
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && row.length > 0) {
      const rowText = row.join(' ').toLowerCase();
      if ((rowText.includes('saldo') && rowText.includes('dia')) ||
          (rowText.includes('pagar') && rowText.includes('receber')) ||
          (rowText.includes('fluxo') && rowText.includes('caixa')) ||
          rowText.includes('situação') ||
          rowText.includes('situacao')) {
        return true;
      }
    }
  }
  return false;
};