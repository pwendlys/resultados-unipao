
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
        
        console.log('XLSX raw data:', jsonData);
        
        const transactions: ParsedTransaction[] = [];
        
        // Pular o cabeçalho (primeira linha) e processar dados
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          console.log(`Processing row ${i}:`, row);
          
          // Verificar se a linha tem dados suficientes
          if (!row || row.length < 3) {
            console.log(`Skipping row ${i} - insufficient data`);
            continue;
          }
          
          const dateValue = row[0];
          const descriptionValue = row[1];
          const amountValue = row[2];
          
          // Verificar se os valores essenciais existem
          if (!dateValue || !descriptionValue || (amountValue === undefined || amountValue === null)) {
            console.log(`Skipping row ${i} - missing essential data:`, { dateValue, descriptionValue, amountValue });
            continue;
          }
          
          const date = String(dateValue).trim();
          const description = String(descriptionValue).trim();
          
          // Processar o valor monetário
          let amount: number;
          if (typeof amountValue === 'number') {
            amount = amountValue;
          } else {
            const amountStr = String(amountValue).replace(',', '.').replace(/[^\d.-]/g, '');
            amount = parseFloat(amountStr);
          }
          
          // Verificar se conseguimos um número válido
          if (isNaN(amount)) {
            console.log(`Skipping row ${i} - invalid amount:`, amountValue);
            continue;
          }
          
          // Determinar tipo baseado no valor (negativo = saída, positivo = entrada)
          const type: 'entrada' | 'saida' = amount >= 0 ? 'entrada' : 'saida';
          
          const transaction = {
            date: formatDate(date),
            description: description,
            amount: Math.abs(amount),
            type
          };
          
          console.log(`Transaction ${i} created:`, transaction);
          transactions.push(transaction);
        }
        
        console.log('Total transactions extracted:', transactions.length);
        resolve(transactions);
      } catch (error) {
        console.error('Error processing XLSX:', error);
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
    // Se já está no formato correto DD/MM/YYYY
    if (typeof dateValue === 'string' && dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = dateValue.split('/');
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
    
    // Se é um número (data do Excel)
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return `${String(date.d).padStart(2, '0')}/${String(date.m).padStart(2, '0')}/${date.y}`;
    }
    
    // Tentar converter outros formatos de string
    if (typeof dateValue === 'string') {
      // Formato DD-MM-YYYY ou DD.MM.YYYY
      if (dateValue.match(/^\d{1,2}[-\.]\d{1,2}[-\.]\d{4}$/)) {
        const parts = dateValue.split(/[-\.]/);
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      
      // Formato YYYY-MM-DD
      if (dateValue.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        const parts = dateValue.split('-');
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
    
    // Tentar converter usando Date
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
    
    // Fallback para string
    return String(dateValue);
  } catch (error) {
    console.log('Error formatting date:', dateValue, error);
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
