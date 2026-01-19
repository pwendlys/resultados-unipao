import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedLine {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  lineIndex: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  description_raw: string | null;
  amount: number;
  type: string;
  entry_index: number | null;
}

interface MatchResult {
  transaction_id: string;
  sort_index: number;
  matched: boolean;
}

// Important keywords for matching
const KEYWORD_TOKENS = [
  'PIX', 'COMPRA', 'DEB', 'DEBITO', 'CREDITO', 'TED', 'DOC', 
  'SALARIO', 'PAGAMENTO', 'TRANSFERENCIA', 'SAQUE', 'DEPOSITO',
  'BOLETO', 'MASTERCARD', 'VISA', 'NACIONAL', 'INTERNACIONAL'
];

// Normalize text for comparison
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9\s]/g, ' ')    // Keep only letters, numbers, spaces
    .replace(/\s+/g, ' ')             // Multiple spaces to single
    .trim();
}

// Parse Brazilian date format to ISO
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Try DD/MM/YYYY or DD/MM/YY or DD/MM
  const brMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3] || new Date().getFullYear().toString();
    if (year.length === 2) {
      year = (parseInt(year) > 50 ? '19' : '20') + year;
    }
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

// Extract text from PDF binary - improved approach
function extractTextFromPdfBinary(pdfBytes: Uint8Array): string {
  // Convert to string for pattern matching
  const rawStr = new TextDecoder('latin1').decode(pdfBytes);
  
  const textParts: string[] = [];
  
  // Method 1: Extract text from stream objects (works for many PDFs)
  // Look for BT...ET blocks (text blocks in PDF)
  const textBlockRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;
  
  while ((match = textBlockRegex.exec(rawStr)) !== null) {
    const block = match[1];
    
    // Extract text within parentheses (Tj operator) - most common
    const tjMatches = block.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g);
    for (const tm of tjMatches) {
      const text = tm[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (text.length > 0) {
        textParts.push(text);
      }
    }
    
    // Extract text from TJ arrays (array of strings with positioning)
    const tjArrayMatches = block.matchAll(/\[((?:[^\[\]]|\[[^\]]*\])*)\]\s*TJ/gi);
    for (const tam of tjArrayMatches) {
      const arrayContent = tam[1];
      const stringMatches = arrayContent.matchAll(/\(((?:[^()\\]|\\.)*)\)/g);
      for (const sm of stringMatches) {
        const text = sm[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        if (text.length > 0) {
          textParts.push(text);
        }
      }
    }
  }
  
  // Method 2: Look for readable text patterns directly (fallback)
  if (textParts.length < 10) {
    // Extract date-like and number patterns that might be transactions
    const directPatterns = rawStr.matchAll(/(\d{2}\/\d{2}(?:\/\d{2,4})?)\s*([A-Z][A-Za-z\s]{5,50})\s*([\d.,]+)/g);
    for (const dp of directPatterns) {
      textParts.push(`${dp[1]} ${dp[2]} ${dp[3]}`);
    }
  }
  
  // Join with newlines to maintain line structure
  let result = textParts.join('\n');
  
  // Clean up common PDF artifacts
  result = result
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
  
  return result;
}

// Extract transaction lines from PDF text - optimized for SICOOB
function extractLinesFromText(text: string): ExtractedLine[] {
  const lines: ExtractedLine[] = [];
  
  // Split by common separators
  const textLines = text.split(/[\n\r]+|(?=\d{2}\/\d{2})/);
  
  console.log(`Processing ${textLines.length} raw lines from extracted text`);
  
  // Patterns for SICOOB and common bank formats
  const datePattern = /\b(\d{2}\/\d{2}(?:\/\d{2,4})?)\b/;
  const valuePattern = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*([CD\-\+])?$/;
  const valuePatternMid = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*([CD\-\+])?/;
  
  // Lines to skip (not transactions)
  const skipPatterns = [
    /saldo\s*(anterior|do\s*dia|final|bloqueado|disponivel)/i,
    /limite\s*(credito|disponivel|utilizado)/i,
    /total\s*(debitos?|creditos?|geral)/i,
    /pagina\s*\d/i,
    /extrato\s*(de\s*)?(conta|bancario)/i,
    /agencia|conta\s*corrente|titular/i,
    /^[\d\s\-\/]+$/, // Only numbers/dates
    /^\s*$/,
  ];
  
  let lineIndex = 0;
  
  for (let i = 0; i < textLines.length; i++) {
    let line = textLines[i].trim();
    if (!line || line.length < 8) continue;
    
    // Skip non-transaction lines
    let shouldSkip = false;
    for (const pattern of skipPatterns) {
      if (pattern.test(line)) {
        shouldSkip = true;
        break;
      }
    }
    if (shouldSkip) continue;
    
    // Find date
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    
    // Find value - try end of line first, then anywhere
    let valueMatch = line.match(valuePattern);
    if (!valueMatch) {
      valueMatch = line.match(valuePatternMid);
    }
    if (!valueMatch) continue;
    
    // Parse value
    const valueStr = valueMatch[1];
    const cleanValue = valueStr.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(cleanValue);
    
    if (isNaN(value) || value <= 0) continue;
    
    // Determine credit/debit
    const indicator = valueMatch[2] || '';
    const lineUpper = line.toUpperCase();
    const isCredit = indicator === 'C' || indicator === '+' || 
                     lineUpper.includes(' C ') || 
                     lineUpper.includes('CREDITO') ||
                     lineUpper.includes('DEPOSITO') ||
                     lineUpper.includes('RECEBIDO');
    
    // Extract description (between date and value)
    const datePos = line.indexOf(dateMatch[0]);
    const valuePos = line.indexOf(valueMatch[0]);
    
    let description = '';
    if (valuePos > datePos) {
      description = line.substring(datePos + dateMatch[0].length, valuePos);
    } else {
      description = line.substring(datePos + dateMatch[0].length);
    }
    
    description = description.replace(/\s+/g, ' ').trim();
    
    // Clean up description - remove trailing numbers and symbols
    description = description.replace(/[\d,.\-]+\s*[CD]?\s*$/, '').trim();
    
    // Skip if description too short
    if (description.length < 3) continue;
    
    lines.push({
      date: dateMatch[1],
      description,
      amount: value,
      type: isCredit ? 'credit' : 'debit',
      lineIndex: lineIndex++,
    });
  }
  
  // Log first 5 extracted lines for debugging
  console.log('First 5 extracted lines:');
  lines.slice(0, 5).forEach((l, i) => {
    console.log(`  [${i}] ${l.date} | ${l.description.substring(0, 40)} | ${l.amount} ${l.type}`);
  });
  
  return lines;
}

// Match extracted lines to transactions with improved scoring
function matchLinesToTransactions(
  lines: ExtractedLine[],
  transactions: Transaction[]
): MatchResult[] {
  const results: MatchResult[] = [];
  const usedTransactionIds = new Set<string>();
  
  console.log(`Matching ${lines.length} PDF lines to ${transactions.length} transactions`);
  
  // First pass: match each PDF line to best transaction
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineAmountCents = Math.round(line.amount * 100);
    const lineNorm = normalizeText(line.description);
    const lineTokens = lineNorm.split(' ').filter(t => t.length > 2);
    const lineDate = parseDate(line.date);
    
    let bestMatch: { tx: Transaction; score: number } | null = null;
    
    for (const tx of transactions) {
      if (usedTransactionIds.has(tx.id)) continue;
      
      const txAmountCents = Math.round(Math.abs(tx.amount) * 100);
      let score = 0;
      
      // PRIORITY 1: Amount match (40 points) - REQUIRED
      if (txAmountCents === lineAmountCents) {
        score += 40;
      } else if (Math.abs(txAmountCents - lineAmountCents) <= 2) {
        score += 35; // Tolerance of 2 cents for rounding
      } else {
        continue; // Amount doesn't match, skip this transaction
      }
      
      const txNorm = normalizeText(tx.description);
      const txNormRaw = normalizeText(tx.description_raw || '');
      
      // PRIORITY 2: Keyword matching (20 points)
      for (const kw of KEYWORD_TOKENS) {
        const lineHasKw = lineNorm.includes(kw);
        const txHasKw = txNorm.includes(kw) || txNormRaw.includes(kw);
        if (lineHasKw && txHasKw) {
          score += 20;
          break;
        }
      }
      
      // PRIORITY 3: Common tokens (15 points max)
      const matchingTokens = lineTokens.filter(t => 
        txNorm.includes(t) || txNormRaw.includes(t)
      );
      score += Math.min(15, matchingTokens.length * 5);
      
      // PRIORITY 4: Date match (15 points) - flexible, not required
      let txDate = tx.date;
      if (txDate.includes('/')) {
        txDate = parseDate(txDate) || txDate;
      }
      
      if (lineDate && txDate) {
        if (lineDate === txDate) {
          score += 15;
        } else {
          // Allow date difference up to 5 days (bank processing time)
          try {
            const diff = Math.abs(new Date(lineDate).getTime() - new Date(txDate).getTime());
            if (diff <= 5 * 86400000) {
              score += 8;
            }
          } catch {
            // Ignore date parsing errors
          }
        }
      }
      
      // PRIORITY 5: Entry index proximity (10 points) - for disambiguating
      if (tx.entry_index !== null) {
        const posDiff = Math.abs(tx.entry_index - i);
        if (posDiff === 0) score += 10;
        else if (posDiff <= 2) score += 6;
        else if (posDiff <= 5) score += 3;
      }
      
      // Minimum score threshold: amount match (35+) plus something else
      if (score >= 40 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { tx, score };
      }
    }
    
    if (bestMatch) {
      usedTransactionIds.add(bestMatch.tx.id);
      results.push({
        transaction_id: bestMatch.tx.id,
        sort_index: i + 1,
        matched: true,
      });
      
      if (i < 3) {
        console.log(`Matched line ${i}: "${line.description.substring(0, 30)}" -> tx "${bestMatch.tx.description.substring(0, 30)}" (score: ${bestMatch.score})`);
      }
    }
  }
  
  console.log(`First pass: ${results.length} matched out of ${lines.length} PDF lines`);
  
  // Add unmatched transactions at the end, sorted by entry_index
  const unmatchedTx = transactions
    .filter(tx => !usedTransactionIds.has(tx.id))
    .sort((a, b) => (a.entry_index || 999) - (b.entry_index || 999));
  
  let nextIndex = results.length + 1;
  for (const tx of unmatchedTx) {
    results.push({
      transaction_id: tx.id,
      sort_index: nextIndex++,
      matched: false,
    });
  }
  
  console.log(`Final: ${results.filter(r => r.matched).length} matched, ${unmatchedTx.length} unmatched`);
  
  return results;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { report_id, file_path } = await req.json();
    
    if (!report_id || !file_path) {
      return new Response(
        JSON.stringify({ error: 'report_id and file_path are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`\n=== Processing PDF for report ${report_id} ===`);
    console.log(`File path: ${file_path}`);
    
    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('fiscal-files')
      .download(file_path);
    
    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download PDF file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract text from PDF using improved method
    const pdfBytes = new Uint8Array(await fileData.arrayBuffer());
    console.log(`PDF size: ${pdfBytes.byteLength} bytes`);
    
    const extractedText = extractTextFromPdfBinary(pdfBytes);
    console.log(`Extracted text length: ${extractedText.length} chars`);
    console.log(`First 300 chars of extracted text: ${extractedText.substring(0, 300)}`);
    
    // Extract transaction lines from PDF text
    const extractedLines = extractLinesFromText(extractedText);
    console.log(`Found ${extractedLines.length} transaction lines in PDF`);
    
    // Fetch transactions for this report via fiscal_reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('fiscal_reviews')
      .select(`
        transaction_id,
        entry_index,
        transactions (
          id,
          date,
          description,
          description_raw,
          amount,
          type,
          entry_index
        )
      `)
      .eq('fiscal_report_id', report_id);
    
    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch report transactions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract transactions from reviews
    const transactions: Transaction[] = reviews
      .filter(r => r.transactions)
      .map(r => ({
        id: r.transaction_id,
        date: (r.transactions as any).date,
        description: (r.transactions as any).description,
        description_raw: (r.transactions as any).description_raw,
        amount: (r.transactions as any).amount,
        type: (r.transactions as any).type,
        entry_index: r.entry_index || (r.transactions as any).entry_index,
      }));
    
    console.log(`Found ${transactions.length} transactions in report`);
    
    // Log sample transactions for debugging
    if (transactions.length > 0) {
      console.log('Sample transactions:');
      transactions.slice(0, 3).forEach((tx, i) => {
        console.log(`  [${i}] ${tx.date} | ${tx.description.substring(0, 40)} | ${tx.amount}`);
      });
    }
    
    // Match lines to transactions or fallback to entry_index
    let matchResults: MatchResult[];
    let usedPdfOrder = false;
    
    if (extractedLines.length >= 3) {
      // Match lines to transactions
      matchResults = matchLinesToTransactions(extractedLines, transactions);
      usedPdfOrder = matchResults.some(r => r.matched);
    } else {
      console.log('Not enough lines extracted from PDF, using entry_index order');
      
      // Sort by original entry_index and assign sort_index
      const sortedTx = [...transactions].sort((a, b) => 
        (a.entry_index || 0) - (b.entry_index || 0)
      );
      
      matchResults = sortedTx.map((tx, idx) => ({
        transaction_id: tx.id,
        sort_index: idx + 1,
        matched: false,
      }));
    }
    
    // Delete existing order for this report
    const { error: deleteError } = await supabase
      .from('fiscal_report_transaction_order')
      .delete()
      .eq('report_id', report_id);
    
    if (deleteError) {
      console.warn('Warning deleting old order:', deleteError);
    }
    
    // Insert new order
    if (matchResults.length > 0) {
      const insertData = matchResults.map(r => ({
        report_id,
        transaction_id: r.transaction_id,
        sort_index: r.sort_index,
        matched: r.matched,
      }));
      
      const { error: insertError } = await supabase
        .from('fiscal_report_transaction_order')
        .insert(insertData);
      
      if (insertError) {
        console.error('Error inserting order:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save transaction order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const matchedCount = matchResults.filter(r => r.matched).length;
    const totalCount = matchResults.length;
    
    console.log(`\n=== Ordering complete: ${matchedCount}/${totalCount} matched ===\n`);
    
    // Prepare detailed message
    let message: string;
    if (extractedLines.length < 3) {
      message = `Não foi possível extrair linhas do PDF. Ordem mantida pelo índice original.`;
    } else if (matchedCount === 0) {
      message = `0 correspondências encontradas entre PDF e transações. Verifique se o extrato corresponde ao período.`;
    } else if (matchedCount < totalCount) {
      message = `Ordem do PDF aplicada: ${matchedCount} de ${totalCount} transações vinculadas. ${totalCount - matchedCount} não encontradas no extrato.`;
    } else {
      message = `Ordem do PDF aplicada com sucesso: ${matchedCount} de ${totalCount} transações vinculadas.`;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        matched: matchedCount,
        total: totalCount,
        extracted_lines: extractedLines.length,
        used_pdf_order: usedPdfOrder,
        message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
