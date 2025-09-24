import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte valores monetários no formato brasileiro para number
 * Exemplos: "R$ 1.500,50" -> 1500.50, "R$ 15.000.500,50" -> 15000500.50
 */
export function parseBrazilianCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'string') return 0;
  
  // Remover R$ e espaços
  let cleanValue = value.replace(/[R$\s]/g, '');
  
  // Se tem vírgula, é o separador decimal brasileiro
  if (cleanValue.includes(',')) {
    const parts = cleanValue.split(',');
    const integerPart = parts[0].replace(/\./g, ''); // Remove pontos de milhares  
    const decimalPart = parts[1] || '00';
    cleanValue = `${integerPart}.${decimalPart}`;
  } else {
    // Se não tem vírgula, apenas remover pontos de milhares
    cleanValue = cleanValue.replace(/\./g, '');
  }
  
  return parseFloat(cleanValue) || 0;
}
