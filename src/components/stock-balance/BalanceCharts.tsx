import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/utils/stockBalanceProcessor';
import type { ItemBalanco } from '@/hooks/useStockBalance';

interface BalanceChartsProps {
  itens: ItemBalanco[];
}

const BalanceCharts = ({ itens }: BalanceChartsProps) => {
  // Prepare data for distribution chart
  const distributionData = [
    {
      name: 'Negativo',
      value: itens.filter(item => (item.diferenca_quantidade || 0) < 0).length,
      fill: '#dc2626'
    },
    {
      name: 'Zero',
      value: itens.filter(item => (item.diferenca_quantidade || 0) === 0).length,
      fill: '#6b7280'
    },
    {
      name: 'Positivo',
      value: itens.filter(item => (item.diferenca_quantidade || 0) > 0).length,
      fill: '#16a34a'
    }
  ];

  // Prepare data for top discrepancies chart
  const topDiscrepancies = itens
    .filter(item => item.diferenca_quantidade !== undefined && item.diferenca_quantidade !== null)
    .map(item => ({
      ...item,
      abs_diferenca: Math.abs(item.diferenca_quantidade || 0),
      display_name: item.codigo || item.descricao || 'Item sem identificação'
    }))
    .sort((a, b) => b.abs_diferenca - a.abs_diferenca)
    .slice(0, 10)
    .map(item => ({
      name: item.display_name.length > 30 ? item.display_name.substring(0, 30) + '...' : item.display_name,
      value: item.diferenca_quantidade || 0,
      abs_value: item.abs_diferenca,
      fill: (item.diferenca_quantidade || 0) >= 0 ? '#16a34a' : '#dc2626'
    }));

  // Prepare data for monetary impact chart
  const monetaryImpact = itens
    .filter(item => item.diferenca_monetaria !== undefined && item.diferenca_monetaria !== null && item.diferenca_monetaria !== 0)
    .map(item => ({
      ...item,
      abs_monetaria: Math.abs(item.diferenca_monetaria || 0),
      display_name: item.codigo || item.descricao || 'Item sem identificação'
    }))
    .sort((a, b) => b.abs_monetaria - a.abs_monetaria)
    .slice(0, 10)
    .map(item => ({
      name: item.display_name.length > 30 ? item.display_name.substring(0, 30) + '...' : item.display_name,
      value: item.diferenca_monetaria || 0,
      abs_value: item.abs_monetaria,
      fill: (item.diferenca_monetaria || 0) >= 0 ? '#16a34a' : '#dc2626'
    }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Sinal da Diferença</CardTitle>
            <CardDescription>
              Quantidade de itens por tipo de diferença
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => value.toString()}
                />
                <Tooltip 
                  formatter={(value) => [value, 'Quantidade de Itens']}
                  labelFormatter={(label) => `Tipo: ${label}`}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Discrepâncias Absolutas</CardTitle>
            <CardDescription>
              Itens com maiores diferenças em quantidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topDiscrepancies.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={topDiscrepancies} 
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => formatNumber(Math.abs(value))}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatNumber(value as number), 'Diferença']}
                    labelFormatter={(label) => `Item: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]}
                  >
                    {topDiscrepancies.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p>Nenhuma discrepância encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {monetaryImpact.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Impacto Monetário</CardTitle>
            <CardDescription>
              Itens com maior impacto monetário nas diferenças
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={monetaryImpact} 
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => formatCurrency(Math.abs(value))}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Impacto Monetário']}
                  labelFormatter={(label) => `Item: ${label}`}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                >
                  {monetaryImpact.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BalanceCharts;