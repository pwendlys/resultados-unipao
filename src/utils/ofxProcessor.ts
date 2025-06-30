
// Função para processar arquivos OFX e extrair transações
export const parseOFX = (ofxContent: string) => {
  console.log('Starting OFX parsing...');
  
  const transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'entrada' | 'saida';
  }> = [];

  try {
    // Remover quebras de linha e espaços extras
    const cleanContent = ofxContent.replace(/\r?\n/g, '').replace(/\s+/g, ' ').trim();
    
    // Encontrar todas as transações (STMTTRN)
    const transactionMatches = cleanContent.match(/<STMTTRN>.*?<\/STMTTRN>/g);
    
    if (!transactionMatches) {
      console.log('No transactions found in OFX file');
      return transactions;
    }

    console.log(`Found ${transactionMatches.length} transactions in OFX`);

    transactionMatches.forEach((transactionBlock) => {
      try {
        // Extrair dados da transação
        const amountMatch = transactionBlock.match(/<TRNAMT>([-\d.,]+)/);
        const dateMatch = transactionBlock.match(/<DTPOSTED>(\d{8})/);
        const memoMatch = transactionBlock.match(/<MEMO>([^<]+)/);
        const nameMatch = transactionBlock.match(/<NAME>([^<]+)/);
        
        if (amountMatch && dateMatch) {
          const amount = parseFloat(amountMatch[1].replace(',', '.'));
          const dateStr = dateMatch[1];
          
          // Converter data YYYYMMDD para DD/MM/YYYY
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          const formattedDate = `${day}/${month}/${year}`;
          
          // Descrição pode vir de MEMO ou NAME
          const description = memoMatch?.[1]?.trim() || nameMatch?.[1]?.trim() || 'Transação OFX';
          
          transactions.push({
            date: formattedDate,
            description: description,
            amount: Math.abs(amount),
            type: amount >= 0 ? 'entrada' : 'saida'
          });
        }
      } catch (error) {
        console.error('Error parsing individual transaction:', error);
      }
    });

    console.log(`Successfully parsed ${transactions.length} transactions from OFX`);
    return transactions;
    
  } catch (error) {
    console.error('Error parsing OFX:', error);
    throw new Error('Erro ao processar arquivo OFX. Verifique se o formato está correto.');
  }
};

// Função para gerar um arquivo OFX de exemplo
export const generateSampleOFX = () => {
  const ofxContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20240101000000
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<ACCTID>12345-6
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20240101000000
<DTEND>20240131000000
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240105000000
<TRNAMT>-150.00
<FITID>202401050001
<MEMO>Pagamento de Boleto - Energia Elétrica
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20240110000000
<TRNAMT>2500.00
<FITID>202401100001
<MEMO>Depósito - Cooperativa
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240115000000
<TRNAMT>-75.50
<FITID>202401150001
<MEMO>Taxa Administrativa
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  const blob = new Blob([ofxContent], { type: 'application/x-ofx' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'exemplo_extrato.ofx');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
