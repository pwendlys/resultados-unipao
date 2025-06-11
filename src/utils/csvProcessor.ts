
export interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
}

export const parseCSV = (csvContent: string): CSVTransaction[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const transactions: CSVTransaction[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (expecting: date,description,amount format)
    const columns = parseCSVLine(line);
    
    if (columns.length >= 3) {
      const date = columns[0].trim();
      const description = columns[1].trim();
      const amountStr = columns[2].trim().replace(/[^\d.,-]/g, '').replace(',', '.');
      const amount = parseFloat(amountStr);
      
      if (date && description && !isNaN(amount)) {
        transactions.push({
          date: formatDate(date),
          description,
          amount: Math.abs(amount),
          type: amount < 0 ? 'saida' : 'entrada'
        });
      }
    }
  }
  
  return transactions;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

const formatDate = (dateStr: string): string => {
  // Try to parse different date formats
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,     // DD/MM/YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/,       // YYYY-MM-DD
    /(\d{1,2})-(\d{1,2})-(\d{4})/        // DD-MM-YYYY
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let day, month, year;
      
      if (pattern === patterns[1]) { // YYYY-MM-DD
        [, year, month, day] = match;
      } else { // DD/MM/YYYY or DD-MM-YYYY
        [, day, month, year] = match;
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return dateStr; // Return as-is if no pattern matches
};

export const generateSampleCSV = (): string => {
  return `Data,Descrição,Valor
01/03/2024,"PIX RECEBIDO - COOPERADO JOÃO SILVA",1200.00
02/03/2024,"PIX ENVIADO - MARIA SILVA SANTOS",-3500.00
03/03/2024,"TED RECEBIDO - COOPERADO MARIA OLIVEIRA",850.00
04/03/2024,"DOC ENVIADO - IMOBILIARIA SAO PAULO LTDA",-2500.00
05/03/2024,"DEBITO AUTOMATICO - COMPANHIA ELETRICA",-420.50`;
};
