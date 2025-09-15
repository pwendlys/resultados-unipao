import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, BarChart3Icon } from 'lucide-react';
import { EntradaPersonalizada } from '@/hooks/useCustomEntries';

interface ChartsViewProps {
  entries: EntradaPersonalizada[];
  dashboardName: string;
}

const ChartsView = ({ entries, dashboardName }: ChartsViewProps) => {
  const [sortByValue, setSortByValue] = useState(false);
  
  const data = useMemo(() => {
    if (!entries.length) return null;

    // Calcular totais
    const totalEntradas = entries
      .filter(e => e.tipo === 'entrada')
      .reduce((sum, e) => sum + Number(e.valor), 0);
    
    const totalSaidas = entries
      .filter(e => e.tipo === 'saida')
      .reduce((sum, e) => sum + Number(e.valor), 0);

    // Evolução mensal
    const evolucaoMensal = entries.reduce((acc, entry) => {
      const key = `${entry.ano}-${entry.mes.toString().padStart(2, '0')}`;
      const monthName = new Date(entry.ano, entry.mes - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!acc[key]) {
        acc[key] = {
          periodo: monthName,
          entradas: 0,
          saidas: 0,
          saldo: 0,
          sortKey: `${entry.ano}-${entry.mes.toString().padStart(2, '0')}`
        };
      }
      
      if (entry.tipo === 'entrada') {
        acc[key].entradas += Number(entry.valor);
      } else {
        acc[key].saidas += Number(entry.valor);
      }
      
      acc[key].saldo = acc[key].entradas - acc[key].saidas;
      
      return acc;
    }, {} as Record<string, any>);

    // Ordenação sempre cronológica por padrão, com opção de ordenar por valor
    const evolucaoArray = Object.values(evolucaoMensal).sort((a: any, b: any) => {
      if (sortByValue) {
        return b.saldo - a.saldo;
      }
      return a.sortKey.localeCompare(b.sortKey);
    });

    // Distribuição por categoria
    const distribuicaoCategoria = entries.reduce((acc, entry) => {
      if (!acc[entry.categoria]) {
        acc[entry.categoria] = {
          categoria: entry.categoria,
          entradas: 0,
          saidas: 0,
          total: 0
        };
      }
      
      if (entry.tipo === 'entrada') {
        acc[entry.categoria].entradas += Number(entry.valor);
      } else {
        acc[entry.categoria].saidas += Number(entry.valor);
      }
      
      acc[entry.categoria].total = acc[entry.categoria].entradas - acc[entry.categoria].saidas;
      
      return acc;
    }, {} as Record<string, any>);

    const distribuicaoArray = Object.values(distribuicaoCategoria);

    // Dados para gráfico de pizza (receitas - entradas)
    const pieDataReceitas = entries
      .filter(e => e.tipo === 'entrada')
      .reduce((acc, entry) => {
        if (!acc[entry.categoria]) {
          acc[entry.categoria] = 0;
        }
        acc[entry.categoria] += Number(entry.valor);
        return acc;
      }, {} as Record<string, number>);

    const pieArrayReceitas = Object.entries(pieDataReceitas).map(([name, value]) => ({ name, value }));

    // Dados para gráfico de pizza (despesas - saídas)
    const pieDataDespesas = entries
      .filter(e => e.tipo === 'saida')
      .reduce((acc, entry) => {
        if (!acc[entry.categoria]) {
          acc[entry.categoria] = 0;
        }
        acc[entry.categoria] += Number(entry.valor);
        return acc;
      }, {} as Record<string, number>);

    const pieArrayDespesas = Object.entries(pieDataDespesas)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Ordenar por valor (maior para menor)

    return {
      totals: {
        entradas: totalEntradas,
        saidas: totalSaidas,
        saldo: totalEntradas - totalSaidas
      },
      evolucaoMensal: evolucaoArray,
      distribuicaoCategoria: distribuicaoArray,
      pieDataReceitas: pieArrayReceitas,
      pieDataDespesas: pieArrayDespesas
    };
  }, [entries, sortByValue]);

  if (!data || entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
          <p className="text-muted-foreground">
            Adicione algumas entradas para visualizar os gráficos
          </p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
  const EXPENSE_COLORS = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#6b1d1d'];

  return (
    <div className="space-y-6">
      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Evolução Mensal</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={sortByValue ? "outline" : "default"}
                size="sm"
                onClick={() => setSortByValue(false)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Cronológica
              </Button>
              <Button
                variant={sortByValue ? "default" : "outline"}
                size="sm"
                onClick={() => setSortByValue(true)}
              >
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Por Valor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.evolucaoMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Line type="monotone" dataKey="entradas" stroke="#82ca9d" name="Entradas" />
              <Line type="monotone" dataKey="saidas" stroke="#ff7c7c" name="Saídas" />
              <Line type="monotone" dataKey="saldo" stroke="#8884d8" name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.distribuicaoCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Bar dataKey="entradas" fill="#82ca9d" name="Entradas" />
                <Bar dataKey="saidas" fill="#ff7c7c" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.pieDataReceitas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.pieDataReceitas.map((entry, index) => (
                    <Cell key={`cell-receitas-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={data.pieDataDespesas} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                  labelStyle={{ color: '#000' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#dc2626"
                  stroke="#b91c1c"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChartsView;