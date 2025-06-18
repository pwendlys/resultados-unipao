
import * as XLSX from 'xlsx';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
}

export const parseXLSX = (file: File): Promise<ParsedTransaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const transactions: ParsedTransaction[] = [];
        
        // Pular o cabeçalho (primeira linha)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          // Verificar se a linha tem dados suficientes
          if (row.length < 3) continue;
          
          const date = row[0] ? String(row[0]) : '';
          const description = row[1] ? String(row[1]) : '';
          const amount = parseFloat(String(row[2] || '0').replace(',', '.'));
          
          // Pular linhas vazias ou inválidas
          if (!date || !description || isNaN(amount)) continue;
          
          // Determinar tipo baseado no valor (negativo = saída, positivo = entrada)
          const type: 'entrada' | 'saida' = amount >= 0 ? 'entrada' : 'saida';
          
          transactions.push({
            date: formatDate(date),
            description: description.trim(),
            amount: Math.abs(amount),
            type
          });
        }
        
        resolve(transactions);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo XLSX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo XLSX'));
    };
    
    reader.readAsBinaryString(file);
  });
};

const formatDate = (dateValue: any): string => {
  try {
    // Se já está no formato correto
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateValue;
    }
    
    // Se é um número (data do Excel)
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return `${String(date.d).padStart(2, '0')}/${String(date.m).padStart(2, '0')}/${date.y}`;
    }
    
    // Tentar converter outros formatos
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
    
    // Fallback para string
    return String(dateValue);
  } catch {
    return String(dateValue);
  }
};

export const generateSampleXLSX = (): void => {
  const sampleData = [
    ['Data', 'Descrição', 'Valor'],
    ['15/06/2024', 'Mensalidade Cooperado João Silva', 500.00],
    ['16/06/2024', 'Pagamento Salário Maria Santos', -2800.00],
    ['17/06/2024', 'Taxa Administrativa', 150.00],
    ['18/06/2024', 'Conta de Luz - Energia Elétrica', -180.50],
    ['19/06/2024', 'Aluguel Sede', -1200.00],
    ['20/06/2024', 'Mensalidade Cooperado Pedro Lima', 500.00]
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');
  
  XLSX.writeFile(workbook, 'exemplo_extrato.xlsx');
};
