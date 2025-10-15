import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AssetsLiabilities } from '@/hooks/useAssetsLiabilities';

interface ChartsProps {
  data?: AssetsLiabilities[];
}

export default function Charts({ data }: ChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível para gráficos.</p>
      </div>
    );
  }

  const latestRecord = data[0];

  // Dados para composição de Ativos
  const ativosComposicao = [
    { name: 'Saldo do Dia', value: Number(latestRecord.saldo_do_dia), color: '#22c55e' },
    { name: 'A Receber', value: Number(latestRecord.a_receber), color: '#16a34a' },
    { name: 'Vencida', value: Number(latestRecord.vencida), color: '#15803d' },
    { name: 'Estoque', value: Number(latestRecord.estoque), color: '#166534' },
    { name: 'Investimento', value: Number(latestRecord.investimento), color: '#14532d' }
  ].filter(item => item.value > 0);

  // Dados para composição de Passivos
  const passivosComposicao = [
    { name: 'A Pagar', value: Number(latestRecord.a_pagar), color: '#ef4444' },
    { name: 'Joia', value: Number(latestRecord.joia), color: '#dc2626' },
    { name: 'Aporte', value: Number(latestRecord.aporte), color: '#b91c1c' }
  ].filter(item => item.value > 0);

  // Dados para evolução temporal (últimos registros)
  const evolucaoData = data.slice(0, 10).reverse().map(record => {
    const totalAtivos = Number(record.saldo_do_dia) + Number(record.a_receber) + 
                       Number(record.vencida) + Number(record.estoque) + Number(record.investimento);
    const totalPassivos = Number(record.a_pagar) + Number(record.joia) + Number(record.aporte);
    
    return {
      data: new Date(record.data_referencia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      Ativos: totalAtivos,
      Passivos: totalPassivos,
      Resultado: totalAtivos - totalPassivos
    };
  });

  // Dados para comparação Ativos vs Passivos (registro mais recente)
  const totalAtivos = Number(latestRecord.saldo_do_dia) + Number(latestRecord.a_receber) + 
                     Number(latestRecord.vencida) + Number(latestRecord.estoque) + Number(latestRecord.investimento);
  const totalPassivos = Number(latestRecord.a_pagar) + Number(latestRecord.joia) + Number(latestRecord.aporte);

  const comparacaoData = [
    { name: 'Ativos', value: totalAtivos, color: '#22c55e' },
    { name: 'Passivos', value: totalPassivos, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Gráfico de Barras - Evolução Temporal */}
      {evolucaoData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Ativos e Passivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolucaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis tickFormatter={formatCurrency} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="Ativos" fill="#22c55e" />
                  <Bar dataKey="Passivos" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Linha - Resultado ao Longo do Tempo */}
      {evolucaoData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendência do Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis tickFormatter={formatCurrency} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Resultado" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Ativos vs Passivos */}
        <Card>
          <CardHeader>
            <CardTitle>Ativos vs Passivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={comparacaoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {comparacaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Composição dos Ativos */}
        {ativosComposicao.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Composição dos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ativosComposicao}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ativosComposicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Pizza - Composição dos Passivos */}
        {passivosComposicao.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Composição dos Passivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passivosComposicao}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {passivosComposicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
