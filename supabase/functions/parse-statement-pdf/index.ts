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
  
  // Try DD/MM/YYYY or DD/MM/YY
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

// Extract lines from PDF text (generic approach for bank statements)
function extractLinesFromText(text: string): ExtractedLine[] {
  const lines: ExtractedLine[] = [];
  const textLines = text.split('\n');
  
  // Pattern to find monetary values
  const valuePatterns = [
    /(\d{1,3}(?:\.\d{3})*,\d{2})\s*([CD\-\+])?/g,   // 1.234,56 C/D
    /[R\$]\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g,           // R$ 1.234,56
    /(\d+,\d{2})\s*([CD\-\+])?/g,                     // 123,45 C/D
  ];
  
  // Pattern to find dates
  const datePattern = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/;
  
  let lineIndex = 0;
  
  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i].trim();
    if (!line || line.length < 5) continue;
    
    // Skip header/footer lines
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes('saldo anterior') ||
      lowerLine.includes('saldo do dia') ||
      lowerLine.includes('saldo final') ||
      lowerLine.includes('bloqueado') ||
      lowerLine.includes('disponível') ||
      lowerLine.includes('limite') ||
      lowerLine.includes('total') ||
      lowerLine.includes('página') ||
      lowerLine.includes('extrato') && lowerLine.includes('conta')
    ) {
      continue;
    }
    
    // Try to extract date and value
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    
    // Look for monetary value in this line
    let foundValue: number | null = null;
    let isCredit = false;
    
    for (const pattern of valuePatterns) {
      const matches = [...line.matchAll(new RegExp(pattern.source, 'g'))];
      for (const match of matches) {
        const valueStr = match[1] || match[0];
        const cleanValue = valueStr
          .replace(/[R\$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.');
        const value = parseFloat(cleanValue);
        
        if (!isNaN(value) && value > 0) {
          foundValue = value;
          // Check for credit indicator
          const indicator = match[2] || '';
          if (indicator === 'C' || indicator === '+' || line.includes(' C ') || line.includes(' C')) {
            isCredit = true;
          }
          break;
        }
      }
      if (foundValue) break;
    }
    
    if (!foundValue) continue;
    
    // Extract description (text between date and value)
    const datePos = line.indexOf(dateMatch[0]);
    const valuePos = line.lastIndexOf(foundValue.toString().replace('.', ',').split('.')[0]);
    
    let description = line.substring(datePos + dateMatch[0].length, valuePos > datePos ? valuePos : line.length);
    description = description.replace(/\s+/g, ' ').trim();
    
    // If description is too short, try to get more context
    if (description.length < 3 && i + 1 < textLines.length) {
      description = textLines[i + 1].trim();
    }
    
    if (description.length >= 3) {
      lines.push({
        date: dateMatch[1],
        description,
        amount: foundValue,
        type: isCredit ? 'credit' : 'debit',
        lineIndex: lineIndex++,
      });
    }
  }
  
  return lines;
}

// Calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  
  if (!norm1 || !norm2) return 0;
  
  // Check for exact match
  if (norm1 === norm2) return 1;
  
  // Check for contains
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;
  
  // Token-based comparison
  const tokens1 = norm1.split(' ').filter(t => t.length > 2);
  const tokens2 = norm2.split(' ').filter(t => t.length > 2);
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  const matchingTokens = tokens1.filter(t1 => 
    tokens2.some(t2 => t2.includes(t1) || t1.includes(t2))
  );
  
  return matchingTokens.length / Math.max(tokens1.length, tokens2.length);
}

// Match extracted lines to transactions
function matchLinesToTransactions(
  lines: ExtractedLine[],
  transactions: Transaction[]
): MatchResult[] {
  const results: MatchResult[] = [];
  const usedTransactionIds = new Set<string>();
  
  // First pass: match by exact/near-exact criteria
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineDate = parseDate(line.date);
    
    let bestMatch: { transaction: Transaction; score: number } | null = null;
    
    for (const tx of transactions) {
      if (usedTransactionIds.has(tx.id)) continue;
      
      // Check amount (with small tolerance)
      const amountMatch = Math.abs(Math.abs(tx.amount) - line.amount) < 0.02;
      if (!amountMatch) continue;
      
      // Parse transaction date
      let txDate = tx.date;
      if (txDate.includes('/')) {
        txDate = parseDate(txDate) || txDate;
      }
      
      // Check date match (exact or +/- 1 day)
      const dateMatch = lineDate && txDate && (
        lineDate === txDate ||
        Math.abs(new Date(lineDate).getTime() - new Date(txDate).getTime()) <= 86400000
      );
      
      // Calculate description similarity
      const descSimilarity = Math.max(
        calculateSimilarity(line.description, tx.description),
        calculateSimilarity(line.description, tx.description_raw || '')
      );
      
      // Score calculation
      let score = 0;
      if (amountMatch) score += 40;
      if (dateMatch) score += 30;
      score += descSimilarity * 30;
      
      // Prefer transactions with similar entry_index (for duplicates)
      if (tx.entry_index !== null) {
        const posDiff = Math.abs(tx.entry_index - i);
        if (posDiff === 0) score += 10;
        else if (posDiff <= 3) score += 5;
      }
      
      if (score > 50 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { transaction: tx, score };
      }
    }
    
    if (bestMatch) {
      usedTransactionIds.add(bestMatch.transaction.id);
      results.push({
        transaction_id: bestMatch.transaction.id,
        sort_index: i + 1,
        matched: true,
      });
    }
  }
  
  // Add unmatched transactions at the end
  let nextIndex = results.length + 1;
  for (const tx of transactions) {
    if (!usedTransactionIds.has(tx.id)) {
      results.push({
        transaction_id: tx.id,
        sort_index: nextIndex++,
        matched: false,
      });
    }
  }
  
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
    
    console.log(`Processing PDF for report ${report_id}, file: ${file_path}`);
    
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
    
    // Extract text from PDF using basic approach
    // Note: For production, consider using a proper PDF parsing service
    const pdfBytes = await fileData.arrayBuffer();
    const pdfText = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(pdfBytes));
    
    // Try to extract readable text (works for text-based PDFs)
    // This is a simplified approach - for scanned PDFs, OCR would be needed
    const cleanText = pdfText
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ')
      .replace(/stream[\s\S]*?endstream/g, ' ')
      .replace(/<<[\s\S]*?>>/g, ' ');
    
    console.log('Extracted text length:', cleanText.length);
    
    // Extract transaction lines from PDF text
    const extractedLines = extractLinesFromText(cleanText);
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
    
    // If no lines extracted from PDF, use original entry_index order
    let matchResults: MatchResult[];
    
    if (extractedLines.length < 3) {
      console.log('Not enough lines extracted from PDF, using entry_index order');
      
      // Sort by original entry_index and assign sort_index
      const sortedTx = [...transactions].sort((a, b) => 
        (a.entry_index || 0) - (b.entry_index || 0)
      );
      
      matchResults = sortedTx.map((tx, idx) => ({
        transaction_id: tx.id,
        sort_index: idx + 1,
        matched: false, // false because we couldn't match from PDF
      }));
    } else {
      // Match lines to transactions
      matchResults = matchLinesToTransactions(extractedLines, transactions);
    }
    
    // Delete existing order for this report
    await supabase
      .from('fiscal_report_transaction_order')
      .delete()
      .eq('report_id', report_id);
    
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
    
    console.log(`Ordering complete: ${matchedCount}/${totalCount} matched`);
    
    return new Response(
      JSON.stringify({
        success: true,
        matched: matchedCount,
        total: totalCount,
        extracted_lines: extractedLines.length,
        message: extractedLines.length >= 3 
          ? `Ordem aplicada: ${matchedCount} de ${totalCount} transações vinculadas ao extrato.`
          : `Ordem mantida pelo índice original (PDF não pôde ser lido como texto).`,
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