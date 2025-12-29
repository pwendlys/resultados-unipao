
import * as XLSX from 'xlsx';

export interface ParsedTransaction {
  date: string;
  description: string;
  description_raw: string;
  amount: number;
  type: 'entrada' | 'saida';
  entry_index: number;
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
        let entryIndex = 1;
        
        // Processar dados do extrato bancário
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          console.log(`Processing row ${i}:`, row);
          
          // Verificar se a linha tem dados suficientes e se tem uma data válida
          if (!row || row.length < 4) {
            console.log(`Skipping row ${i} - insufficient columns`);
            continue;
          }
          
          const dateValue = row[0];
          const documentValue = row[1];
          const descriptionValue = row[2];
          const amountValue = row[3];
          
          // Pular linhas de cabeçalho ou linhas vazias
          if (!dateValue || dateValue === 'DATA' || dateValue === 'EXTRATO CONTA CORRENTE') {
            console.log(`Skipping row ${i} - header or empty date`);
            continue;
          }
          
          // Pular linhas com saldo do dia ou saldo anterior
          if (typeof descriptionValue === 'string' && 
              (descriptionValue.includes('SALDO DO DIA') || 
               descriptionValue.includes('SALDO ANTERIOR') || 
               descriptionValue.includes('SALDO BLOQUEADO'))) {
            console.log(`Skipping row ${i} - saldo line`);
            continue;
          }
          
          // Verificar se temos uma data válida
          const dateStr = String(dateValue).trim();
          if (!dateStr || dateStr === '' || !dateStr.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
            console.log(`Skipping row ${i} - invalid date format:`, dateStr);
            continue;
          }
          
          // Verificar se temos um valor válido
          if (!amountValue || amountValue === '') {
            console.log(`Skipping row ${i} - no amount value`);
            continue;
          }
          
          const amountStr = String(amountValue).trim();
          
          // Extrair valor numérico e tipo (C para crédito, D para débito)
          let amount: number = 0;
          let type: 'entrada' | 'saida' = 'entrada';
          
          // Padrões para valores: "- 50,00 D", "2.504,21 C", etc.
          const creditMatch = amountStr.match(/([\d.,]+)\s*C$/);
          const debitMatch = amountStr.match(/-?\s*([\d.,]+)\s*D$/);
          const negativeMatch = amountStr.match(/^-\s*([\d.,]+)/);
          
          if (creditMatch) {
            // Valor de crédito (entrada)
            const numStr = creditMatch[1].replace(/\./g, '').replace(',', '.');
            amount = parseFloat(numStr);
            type = 'entrada';
          } else if (debitMatch) {
            // Valor de débito (saída)
            const numStr = debitMatch[1].replace(/\./g, '').replace(',', '.');
            amount = parseFloat(numStr);
            type = 'saida';
          } else if (negativeMatch) {
            // Valor negativo (saída)
            const numStr = negativeMatch[1].replace(/\./g, '').replace(',', '.');
            amount = parseFloat(numStr);
            type = 'saida';
          } else {
            // Tentar extrair número simples
            const numStr = amountStr.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
            amount = parseFloat(numStr);
            if (isNaN(amount)) {
              console.log(`Skipping row ${i} - could not parse amount:`, amountStr);
              continue;
            }
            // Se negativo, é saída
            type = amount < 0 ? 'saida' : 'entrada';
            amount = Math.abs(amount);
          }
          
          if (isNaN(amount) || amount <= 0) {
            console.log(`Skipping row ${i} - invalid amount:`, amount);
            continue;
          }
          
          // Construir descrição completa
          let fullDescription = String(descriptionValue || '').trim();
          
          // Para extratos bancários, podemos ter descrição adicional nas próximas linhas
          // Vamos verificar se as próximas linhas contêm informações adicionais
          let additionalInfo = [];
          for (let j = i + 1; j < Math.min(i + 5, jsonData.length); j++) {
            const nextRow = jsonData[j] as any[];
            if (nextRow && nextRow.length >= 3 && 
                (!nextRow[0] || nextRow[0] === '') && 
                (!nextRow[1] || nextRow[1] === '') && 
                nextRow[2] && String(nextRow[2]).trim() !== '') {
              const additionalDesc = String(nextRow[2]).trim();
              if (additionalDesc && 
                  !additionalDesc.includes('SALDO') && 
                  !additionalDesc.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/) && // CPF
                  !additionalDesc.match(/\*\*\*\.\d{3}\.\d{3}-\*\*/) && // CPF mascarado
                  additionalDesc.length > 3) {
                additionalInfo.push(additionalDesc);
              }
            } else {
              break;
            }
          }
          
          if (additionalInfo.length > 0) {
            fullDescription = `${fullDescription} - ${additionalInfo.join(' - ')}`;
          }
          
          if (!fullDescription || fullDescription.trim() === '') {
            fullDescription = `${documentValue || 'Transação'} - ${dateStr}`;
          }
          
          // Build raw description from row data
          const rawParts = [dateStr, documentValue, descriptionValue, amountStr].filter(Boolean);
          const descriptionRaw = rawParts.join(' | ') + (additionalInfo.length > 0 ? ' | ' + additionalInfo.join(' | ') : '');
          
          const transaction: ParsedTransaction = {
            date: formatDate(dateStr),
            description: fullDescription,
            description_raw: descriptionRaw,
            amount: amount,
            type: type,
            entry_index: entryIndex++
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
