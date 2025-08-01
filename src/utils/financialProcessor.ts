import * as XLSX from 'xlsx';
import { DocumentoFinanceiro, ItemFinanceiro } from '@/hooks/useFinancialData';

export interface ProcessedFinancialData {
  documento: Omit<DocumentoFinanceiro, 'id' | 'created_at' | 'updated_at'>;
  itens: Omit<ItemFinanceiro, 'id' | 'documento_id' | 'created_at' | 'updated_at'>[];
}

// Processar arquivo CSV
export const processCSVFinancial = async (file: File, tipoDocumento: string, periodo: string, banco?: string): Promise<ProcessedFinancialData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          throw new Error('Arquivo CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const itens: Omit<ItemFinanceiro, 'id' | 'documento_id' | 'created_at' | 'updated_at'>[] = [];
        let valorTotal = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length >= 3) {
            const valor = parseFloat(values[2]?.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
            valorTotal += Math.abs(valor);

            itens.push({
              descricao: values[1] || `Item ${i}`,
              valor: Math.abs(valor),
              data_vencimento: values[3] ? formatDate(values[3]) : undefined,
              data_emissao: values[4] ? formatDate(values[4]) : undefined,
              numero_documento: values[0] || '',
              categoria: values[5] || 'Sem categoria',
              status: 'pendente',
              juros: 0,
              multa: 0,
            });
          }
        }

        const documento: Omit<DocumentoFinanceiro, 'id' | 'created_at' | 'updated_at'> = {
          nome: file.name,
          tipo_documento: tipoDocumento as any,
          arquivo_original: file.name,
          periodo,
          banco,
          valor_total: valorTotal,
          quantidade_documentos: itens.length,
          status: 'processado',
        };

        resolve({ documento, itens });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

// Processar arquivo XLSX
export const processXLSXFinancial = async (file: File, tipoDocumento: string, periodo: string, banco?: string): Promise<ProcessedFinancialData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          throw new Error('Planilha deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
        }

        const itens: Omit<ItemFinanceiro, 'id' | 'documento_id' | 'created_at' | 'updated_at'>[] = [];
        let valorTotal = 0;

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          if (row && row.length >= 3) {
            const valor = parseFloat(String(row[2] || 0).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
            valorTotal += Math.abs(valor);

            itens.push({
              descricao: String(row[1] || `Item ${i}`),
              valor: Math.abs(valor),
              data_vencimento: row[3] ? formatDate(String(row[3])) : undefined,
              data_emissao: row[4] ? formatDate(String(row[4])) : undefined,
              numero_documento: String(row[0] || ''),
              categoria: String(row[5] || 'Sem categoria'),
              status: 'pendente',
              juros: 0,
              multa: 0,
            });
          }
        }

        const documento: Omit<DocumentoFinanceiro, 'id' | 'created_at' | 'updated_at'> = {
          nome: file.name,
          tipo_documento: tipoDocumento as any,
          arquivo_original: file.name,
          periodo,
          banco,
          valor_total: valorTotal,
          quantidade_documentos: itens.length,
          status: 'processado',
        };

        resolve({ documento, itens });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
};

// Processar arquivo PDF (simulado - em produção seria necessário um parser específico)
export const processPDFFinancial = async (file: File, tipoDocumento: string, periodo: string, banco?: string): Promise<ProcessedFinancialData> => {
  // Simulação de processamento de PDF
  // Em produção, seria necessário usar uma biblioteca como pdf-parse ou PDF.js
  const documento: Omit<DocumentoFinanceiro, 'id' | 'created_at' | 'updated_at'> = {
    nome: file.name,
    tipo_documento: tipoDocumento as any,
    arquivo_original: file.name,
    periodo,
    banco,
    valor_total: 0,
    quantidade_documentos: 0,
    status: 'pendente',
    observacoes: 'Processamento de PDF requer implementação específica',
  };

  const itens: Omit<ItemFinanceiro, 'id' | 'documento_id' | 'created_at' | 'updated_at'>[] = [];

  return { documento, itens };
};

// Função auxiliar para formatar datas
const formatDate = (dateStr: string): string | undefined => {
  try {
    // Tenta diferentes formatos de data
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // Tenta formato brasileiro (dd/mm/yyyy)
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

// Função para baixar modelo CSV
export const downloadFinancialSampleCSV = () => {
  const csvContent = [
    'Número do Documento,Descrição,Valor,Data de Vencimento,Data de Emissão,Categoria',
    '001,Pagamento de fornecedor A,1500.00,2024-02-15,2024-01-15,Fornecedores',
    '002,Recebimento cliente B,2500.00,2024-02-20,2024-01-20,Vendas',
    '003,Conta de energia,300.00,2024-02-10,2024-01-28,Utilidades'
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_financeiro.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

// Função para baixar modelo XLSX
export const downloadFinancialSampleXLSX = () => {
  const data = [
    ['Número do Documento', 'Descrição', 'Valor', 'Data de Vencimento', 'Data de Emissão', 'Categoria'],
    ['001', 'Pagamento de fornecedor A', 1500.00, '2024-02-15', '2024-01-15', 'Fornecedores'],
    ['002', 'Recebimento cliente B', 2500.00, '2024-02-20', '2024-01-20', 'Vendas'],
    ['003', 'Conta de energia', 300.00, '2024-02-10', '2024-01-28', 'Utilidades']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados Financeiros');
  XLSX.writeFile(wb, 'modelo_financeiro.xlsx');
};