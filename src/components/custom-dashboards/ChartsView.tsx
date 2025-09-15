import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { EntradaPersonalizada } from '@/hooks/useCustomEntries';

interface ChartsViewProps {
  entries: EntradaPersonalizada[];
  dashboardName: string;
}

const ChartsView = ({ entries, dashboardName }: ChartsViewProps) => {
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
          saldo: 0
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

    const evolucaoArray = Object.values(evolucaoMensal).sort((a: any, b: any) => a.periodo.localeCompare(b.periodo));

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

    // Dados para gráfico de pizza (apenas entradas)
    const pieData = entries
      .filter(e => e.tipo === 'entrada')
      .reduce((acc, entry) => {
        if (!acc[entry.categoria]) {
          acc[entry.categoria] = 0;
        }
        acc[entry.categoria] += Number(entry.valor);
        return acc;
      }, {} as Record<string, number>);

    const pieArray = Object.entries(pieData).map(([name, value]) => ({ name, value }));

    return {
      totals: {
        entradas: totalEntradas,
        saidas: totalSaidas,
        saldo: totalEntradas - totalSaidas
      },
      evolucaoMensal: evolucaoArray,
      distribuicaoCategoria: distribuicaoArray,
      pieData: pieArray
    };
  }, [entries]);

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

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {data.totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {data.totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <DollarSign className={`h-4 w-4 ${data.totals.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.totals.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {data.totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
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
                  data={data.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChartsView;