import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ComparisonData } from '@/hooks/useBalanceComparison';
import { formatCurrency } from '@/utils/financialProcessor';

interface ComparisonChartsProps {
  data: ComparisonData;
}

const ComparisonCharts = ({ data }: ComparisonChartsProps) => {
  // Preparar dados para o gráfico de evolução temporal
  const evolutionData = data.balances.map((balance, index) => ({
    periodo: balance.periodo,
    resultado_monetario: balance.resultado_monetario || 0,
    itens_positivos: balance.itens_positivos || 0,
    itens_negativos: balance.itens_negativos || 0,
    itens_neutros: balance.itens_neutros || 0,
    total_itens: balance.total_itens || 0
  }));

  // Top 5 melhorias e pioras para gráfico de barras
  const topVariations = [
    ...data.kpis.top_melhorias.slice(0, 5).map(item => ({
      item: item.codigo || item.descricao || 'N/A',
      variacao: item.variacao_monetaria || 0,
      tipo: 'Melhoria'
    })),
    ...data.kpis.top_pioras.slice(0, 5).map(item => ({
      item: item.codigo || item.descricao || 'N/A',
      variacao: item.variacao_monetaria || 0,
      tipo: 'Piora'
    }))
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Evolução do Resultado Monetário */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Resultado Monetário</CardTitle>
          <CardDescription>
            Comparação do resultado entre os períodos selecionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="periodo" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Resultado']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="resultado_monetario" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução de Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução por Tipo de Item</CardTitle>
          <CardDescription>
            Quantidade de itens positivos, negativos e neutros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="periodo" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="itens_positivos" 
                stroke="hsl(142 76% 36%)" 
                strokeWidth={2}
                name="Positivos"
              />
              <Line 
                type="monotone" 
                dataKey="itens_negativos" 
                stroke="hsl(0 84% 60%)" 
                strokeWidth={2}
                name="Negativos"
              />
              <Line 
                type="monotone" 
                dataKey="itens_neutros" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                name="Neutros"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Top Variações */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top Variações Monetárias</CardTitle>
          <CardDescription>
            Maiores melhorias (verde) e pioras (vermelho) entre os períodos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topVariations} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                type="category"
                dataKey="item" 
                fontSize={10}
                width={100}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Variação']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar 
                dataKey="variacao" 
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonCharts;