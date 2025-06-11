
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  Calendar,
  Download
} from 'lucide-react';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');

  // Dados mockados para demonstração
  const financialData = {
    totalReceitas: 125000,
    totalDespesas: 89500,
    lucroLiquido: 35500,
    margem: 28.4
  };

  const receitasPorCategoria = [
    { name: 'Mensalidades', value: 85000, color: 'hsl(140 40% 55%)' },
    { name: 'Taxa Administrativa', value: 40000, color: 'hsl(45 93% 47%)' }
  ];

  const despesasPorCategoria = [
    { name: 'Folha de Pagamento', value: 45000, color: 'hsl(0 84.2% 60.2%)' },
    { name: 'Aluguel', value: 15000, color: 'hsl(47.9 95.8% 53.1%)' },
    { name: 'Serviços de Terceiros', value: 12000, color: 'hsl(221.2 83.2% 53.3%)' },
    { name: 'Vale Transporte', value: 8500, color: 'hsl(142 76% 36%)' },
    { name: 'Encargos Sociais', value: 9000, color: 'hsl(262.1 83.3% 57.8%)' }
  ];

  const evoluçaoMensal = [
    { mes: 'Jan', receitas: 120000, despesas: 85000 },
    { mes: 'Fev', receitas: 115000, despesas: 88000 },
    { mes: 'Mar', receitas: 125000, despesas: 89500 },
    { mes: 'Abr', receitas: 130000, despesas: 92000 },
    { mes: 'Mai', receitas: 128000, despesas: 90000 }
  ];

  const chartConfig = {
    receitas: {
      label: "Receitas",
      color: "hsl(140 40% 55%)"
    },
    despesas: {
      label: "Despesas", 
      color: "hsl(0 84.2% 60.2%)"
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral do DRE da Cooperativa Unipão</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            {['diario', 'semanal', 'mensal', 'personalizado'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar DRE
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {financialData.totalReceitas.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {financialData.totalDespesas.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">+5% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {financialData.lucroLiquido.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Margem de {financialData.margem}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extratos Processados</CardTitle>
            <FileText className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>Comparativo de receitas e despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={evoluçaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line 
                  type="monotone" 
                  dataKey="receitas" 
                  stroke="var(--color-receitas)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke="var(--color-despesas)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Receitas</CardTitle>
            <CardDescription>Por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={receitasPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {receitasPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Despesas por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
          <CardDescription>Principais gastos do período</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={despesasPorCategoria}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(0 84.2% 60.2%)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Resumo de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Extratos</CardTitle>
          <CardDescription>Acompanhe o processamento dos arquivos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Extrato Março 2024</p>
                  <p className="text-sm text-muted-foreground">Banco do Brasil - Conta Corrente</p>
                </div>
              </div>
              <Badge className="bg-primary">Processado</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-secondary" />
                <div>
                  <p className="font-medium">Extrato Abril 2024</p>
                  <p className="text-sm text-muted-foreground">Caixa Econômica - Poupança</p>
                </div>
              </div>
              <Badge variant="outline">Pendente Categorização</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
