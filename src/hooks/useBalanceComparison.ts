import { useMemo } from 'react';
import { BalancoEstoque, ItemBalanco } from './useStockBalance';

export interface ComparisonData {
  balanceIds: string[];
  balances: BalancoEstoque[];
  itemsComparison: ItemComparison[];
  kpis: ComparisonKPIs;
}

export interface ItemComparison {
  codigo?: string;
  descricao?: string;
  balances: {
    [balancoId: string]: {
      quantidade_sistema?: number;
      quantidade_real?: number;
      diferenca_quantidade?: number;
      diferenca_monetaria?: number;
      unitario?: number;
    };
  };
  variacao_monetaria?: number;
  variacao_percentual?: number;
  trend: 'melhorou' | 'piorou' | 'manteve';
}

export interface ComparisonKPIs {
  evolucao_resultado: {
    inicial: number;
    final: number;
    variacao: number;
    variacao_percentual: number;
  };
  evolucao_itens: {
    positivos: { inicial: number; final: number; variacao: number };
    negativos: { inicial: number; final: number; variacao: number };
    neutros: { inicial: number; final: number; variacao: number };
  };
  top_melhorias: ItemComparison[];
  top_pioras: ItemComparison[];
}

export function useBalanceComparison(
  selectedBalances: BalancoEstoque[],
  allItems: { [balancoId: string]: ItemBalanco[] }
): ComparisonData | null {
  return useMemo(() => {
    if (selectedBalances.length < 2) return null;

    // Ordenar balanços por data para análise temporal
    const sortedBalances = [...selectedBalances].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const balanceIds = sortedBalances.map(b => b.id);
    
    // Criar mapa de todos os itens únicos por código/descrição
    const itemsMap = new Map<string, ItemComparison>();

    sortedBalances.forEach(balance => {
      const items = allItems[balance.id] || [];
      
      items.forEach(item => {
        const key = item.codigo || item.descricao || 'sem-identificacao';
        
        if (!itemsMap.has(key)) {
          itemsMap.set(key, {
            codigo: item.codigo,
            descricao: item.descricao,
            balances: {},
            trend: 'manteve'
          });
        }

        const comparisonItem = itemsMap.get(key)!;
        comparisonItem.balances[balance.id] = {
          quantidade_sistema: item.quantidade_sistema,
          quantidade_real: item.quantidade_real,
          diferenca_quantidade: item.diferenca_quantidade,
          diferenca_monetaria: item.diferenca_monetaria,
          unitario: item.unitario
        };
      });
    });

    // Calcular variações e tendências
    const itemsComparison: ItemComparison[] = Array.from(itemsMap.values()).map(item => {
      const firstBalance = sortedBalances[0];
      const lastBalance = sortedBalances[sortedBalances.length - 1];
      
      const firstValue = item.balances[firstBalance.id]?.diferenca_monetaria || 0;
      const lastValue = item.balances[lastBalance.id]?.diferenca_monetaria || 0;
      
      const variacao_monetaria = lastValue - firstValue;
      const variacao_percentual = firstValue !== 0 ? (variacao_monetaria / Math.abs(firstValue)) * 100 : 0;
      
      let trend: 'melhorou' | 'piorou' | 'manteve' = 'manteve';
      if (Math.abs(variacao_monetaria) > 1) { // Considera significativo acima de R$ 1
        trend = variacao_monetaria > 0 ? 'piorou' : 'melhorou';
      }

      return {
        ...item,
        variacao_monetaria,
        variacao_percentual,
        trend
      };
    });

    // Calcular KPIs comparativos
    const firstBalance = sortedBalances[0];
    const lastBalance = sortedBalances[sortedBalances.length - 1];

    const kpis: ComparisonKPIs = {
      evolucao_resultado: {
        inicial: firstBalance.resultado_monetario || 0,
        final: lastBalance.resultado_monetario || 0,
        variacao: (lastBalance.resultado_monetario || 0) - (firstBalance.resultado_monetario || 0),
        variacao_percentual: firstBalance.resultado_monetario !== 0 
          ? (((lastBalance.resultado_monetario || 0) - (firstBalance.resultado_monetario || 0)) / Math.abs(firstBalance.resultado_monetario)) * 100 
          : 0
      },
      evolucao_itens: {
        positivos: {
          inicial: firstBalance.itens_positivos || 0,
          final: lastBalance.itens_positivos || 0,
          variacao: (lastBalance.itens_positivos || 0) - (firstBalance.itens_positivos || 0)
        },
        negativos: {
          inicial: firstBalance.itens_negativos || 0,
          final: lastBalance.itens_negativos || 0,
          variacao: (lastBalance.itens_negativos || 0) - (firstBalance.itens_negativos || 0)
        },
        neutros: {
          inicial: firstBalance.itens_neutros || 0,
          final: lastBalance.itens_neutros || 0,
          variacao: (lastBalance.itens_neutros || 0) - (firstBalance.itens_neutros || 0)
        }
      },
      top_melhorias: itemsComparison
        .filter(item => item.trend === 'melhorou')
        .sort((a, b) => (a.variacao_monetaria || 0) - (b.variacao_monetaria || 0))
        .slice(0, 10),
      top_pioras: itemsComparison
        .filter(item => item.trend === 'piorou')
        .sort((a, b) => (b.variacao_monetaria || 0) - (a.variacao_monetaria || 0))
        .slice(0, 10)
    };

    return {
      balanceIds,
      balances: sortedBalances,
      itemsComparison,
      kpis
    };
  }, [selectedBalances, allItems]);
}