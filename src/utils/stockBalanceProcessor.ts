import * as XLSX from 'xlsx';

export interface StockBalanceItem {
  codigo?: string;
  descricao?: string;
  quantidade_sistema?: number;
  quantidade_real?: number;
  diferenca_quantidade?: number;
  unitario?: number;
  valor_sistema?: number;
  valor_real?: number;
  diferenca_monetaria?: number;
}

export interface ProcessedStockBalance {
  items: StockBalanceItem[];
  summary: {
    total_itens: number;
    itens_negativos: number;
    itens_positivos: number;
    itens_neutros: number;
    resultado_monetario: number;
  };
}

export interface ColumnMapping {
  [key: string]: string;
}

// Column aliases for automatic detection
const COLUMN_ALIASES = {
  codigo: ['cod', 'codigo', 'código', 'code'],
  descricao: ['descricao', 'descrição', 'description', 'desc'],
  quantidade_sistema: ['quantidade', 'qtd', 'qtd_sistema', 'quantity', 'system_qty'],
  quantidade_real: ['real', 'qtd_real', 'real_qty', 'counted'],
  diferenca_quantidade: ['dif.qtdxrea', 'dif_qtdxreal', 'dif_qtd_real', 'diferenca', 'difference'],
  unitario: ['unitario', 'preço unitário', 'preco_unit', 'unit_price', 'price'],
  valor_sistema: ['qtd x preço', 'valor_sistema', 'system_value'],
  valor_real: ['real x unitário', 'valor_real', 'real_value'],
  diferenca_monetaria: ['dif real/estoque', 'dif_monetaria', 'monetary_diff']
};

export function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  Object.entries(COLUMN_ALIASES).forEach(([key, aliases]) => {
    const foundHeader = normalizedHeaders.find(header => 
      aliases.some(alias => header.includes(alias.toLowerCase()))
    );
    if (foundHeader) {
      const originalIndex = normalizedHeaders.indexOf(foundHeader);
      mapping[key] = headers[originalIndex];
    }
  });
  
  return mapping;
}

export function parseStockBalanceFile(file: File): Promise<{ headers: string[]; data: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          reject(new Error('Arquivo vazio ou inválido'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        resolve({ headers, data: rows });
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + error));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function processStockBalanceData(
  rawData: any[], 
  headers: string[], 
  mapping: ColumnMapping
): ProcessedStockBalance {
  const items: StockBalanceItem[] = [];
  
  rawData.forEach(row => {
    const item: StockBalanceItem = {};
    
    // Map columns based on the provided mapping
    Object.entries(mapping).forEach(([key, headerName]) => {
      const headerIndex = headers.indexOf(headerName);
      if (headerIndex !== -1) {
        let value = row[headerIndex];
        
        // Convert numeric fields
        if (['quantidade_sistema', 'quantidade_real', 'diferenca_quantidade', 'unitario', 'valor_sistema', 'valor_real', 'diferenca_monetaria'].includes(key)) {
          value = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
        }
        
        (item as any)[key] = value;
      }
    });
    
    // Calculate missing fields
    if (item.quantidade_sistema !== undefined && item.quantidade_real !== undefined && item.diferenca_quantidade === undefined) {
      item.diferenca_quantidade = item.quantidade_real - item.quantidade_sistema;
    }
    
    if (item.quantidade_sistema !== undefined && item.unitario !== undefined && item.valor_sistema === undefined) {
      item.valor_sistema = item.quantidade_sistema * item.unitario;
    }
    
    if (item.quantidade_real !== undefined && item.unitario !== undefined && item.valor_real === undefined) {
      item.valor_real = item.quantidade_real * item.unitario;
    }
    
    if (item.valor_real !== undefined && item.valor_sistema !== undefined && item.diferenca_monetaria === undefined) {
      item.diferenca_monetaria = item.valor_real - item.valor_sistema;
    }
    
    items.push(item);
  });
  
  // Calculate summary
  const summary = {
    total_itens: items.length,
    itens_negativos: items.filter(item => (item.diferenca_quantidade || 0) < 0).length,
    itens_positivos: items.filter(item => (item.diferenca_quantidade || 0) > 0).length,
    itens_neutros: items.filter(item => (item.diferenca_quantidade || 0) === 0).length,
    resultado_monetario: items.reduce((sum, item) => sum + (item.diferenca_monetaria || 0), 0)
  };
  
  return { items, summary };
}

export function validateFile(file: File): string | null {
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!validExtensions.includes(fileExtension)) {
    return 'Arquivo inválido. Envie .xlsx ou .csv.';
  }
  
  if (file.size > 20 * 1024 * 1024) { // 20MB limit
    return 'Arquivo muito grande. Tamanho máximo: 20MB.';
  }
  
  return null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}