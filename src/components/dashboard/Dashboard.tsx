
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  Calendar as CalendarIcon,
  Download
} from 'lucide-react';
import { useExtratos, useTransactions } from '@/hooks/useSupabaseData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: extratos = [] } = useExtratos();
  const { data: allTransactions = [] } = useTransactions();

  // Filtrar transações baseado no período selecionado
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      switch (selectedPeriod) {
        case 'diario':
          return transactionDate >= today;
          
        case 'semanal':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return transactionDate >= weekAgo;
          
        case 'mensal':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return transactionDate >= monthAgo;
          
        case 'personalizado':
          if (!customDateRange.from || !customDateRange.to) return true;
          return transactionDate >= customDateRange.from && transactionDate <= customDateRange.to;
          
        default:
          return true;
      }
    });
  }, [allTransactions, selectedPeriod, customDateRange]);

  // Calcular dados financeiros a partir das transações filtradas
  const financialData = useMemo(() => {
    const entradas = filteredTransactions.filter(t => t.type === 'entrada');
    const saidas = filteredTransactions.filter(t => t.type === 'saida');
    
    const totalReceitas = entradas.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDespesas = saidas.reduce((sum, t) => sum + Number(t.amount), 0);
    const lucroLiquido = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;

    return {
      totalReceitas,
      totalDespesas,
      lucroLiquido,
      margem
    };
  }, [filteredTransactions]);

  // Agrupar receitas por categoria (com dados filtrados)
  const receitasPorCategoria = useMemo(() => {
    const entradas = filteredTransactions.filter(t => t.type === 'entrada' && t.category);
    const grouped = entradas.reduce((acc, t) => {
      const category = t.category || 'Sem Categoria';
      acc[category] = (acc[category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value], index) => ({
      name,
      value,
      color: index === 0 ? 'hsl(140 40% 55%)' : 'hsl(45 93% 47%)'
    }));
  }, [filteredTransactions]);

  // Agrupar despesas por categoria (com dados filtrados)
  const despesasPorCategoria = useMemo(() => {
    const saidas = filteredTransactions.filter(t => t.type === 'saida' && t.category);
    const grouped = saidas.reduce((acc, t) => {
      const category = t.category || 'Sem Categoria';
      acc[category] = (acc[category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    const colors = [
      'hsl(0 84.2% 60.2%)',
      'hsl(47.9 95.8% 53.1%)',
      'hsl(221.2 83.2% 53.3%)',
      'hsl(142 76% 36%)',
      'hsl(262.1 83.3% 57.8%)'
    ];

    return Object.entries(grouped).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  }, [filteredTransactions]);

  // Evolução mensal (com dados filtrados)
  const evoluçaoMensal = useMemo(() => {
    // Agrupar transações por mês
    const monthlyData = filteredTransactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { receitas: 0, despesas: 0 };
      }
      
      if (t.type === 'entrada') {
        acc[monthKey].receitas += Number(t.amount);
      } else {
        acc[monthKey].despesas += Number(t.amount);
      }
      
      return acc;
    }, {} as Record<string, { receitas: number; despesas: number }>);

    // Converter para array e ordenar
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-5) // Últimos 5 meses
      .map(([month, data]) => ({
        mes: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: data.receitas,
        despesas: data.despesas
      }));
  }, [filteredTransactions]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period === 'personalizado') {
      setShowDatePicker(true);
    }
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'personalizado' && customDateRange.from && customDateRange.to) {
      return `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`;
    }
    return selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1);
  };

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

  const receitasChartConfig = {
    mensalidades: {
      label: "Mensalidades",
      color: "hsl(140 40% 55%)"
    },
    taxaAdministrativa: {
      label: "Taxa Administrativa",
      color: "hsl(45 93% 47%)"
    }
  };

  const despesasChartConfig = {
    folhaPagamento: {
      label: "Folha de Pagamento",
      color: "hsl(0 84.2% 60.2%)"
    },
    aluguel: {
      label: "Aluguel",
      color: "hsl(47.9 95.8% 53.1%)"
    },
    servicosTerceiros: {
      label: "Serviços de Terceiros",
      color: "hsl(221.2 83.2% 53.3%)"
    },
    valeTransporte: {
      label: "Vale Transporte",
      color: "hsl(142 76% 36%)"
    },
    encargosSociais: {
      label: "Encargos Sociais",
      color: "hsl(262.1 83.3% 57.8%)"
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral do DRE da Cooperativa Unipão - Período: {getPeriodLabel()}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            {['diario', 'semanal', 'mensal', 'personalizado'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange(period)}
              >
                {period === 'personalizado' ? 'Personalizado' : period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
          
          {selectedPeriod === 'personalizado' && (
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {customDateRange.from && customDateRange.to 
                    ? `${format(customDateRange.from, 'dd/MM')} - ${format(customDateRange.to, 'dd/MM')}`
                    : 'Selecionar período'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: customDateRange.from,
                    to: customDateRange.to,
                  }}
                  onSelect={(range) => {
                    setCustomDateRange({
                      from: range?.from,
                      to: range?.to,
                    });
                    if (range?.from && range?.to) {
                      setShowDatePicker(false);
                    }
                  }}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
          
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
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.filter(t => t.type === 'entrada').length} transações
            </p>
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
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.filter(t => t.type === 'saida').length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialData.lucroLiquido >= 0 ? 'text-primary' : 'text-destructive'}`}>
              R$ {financialData.lucroLiquido.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Margem de {financialData.margem.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extratos Processados</CardTitle>
            <FileText className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extratos.length}</div>
            <p className="text-xs text-muted-foreground">{filteredTransactions.length} transações no período</p>
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
            {evoluçaoMensal.length > 0 ? (
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Não há dados suficientes para exibir o gráfico no período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Receitas</CardTitle>
            <CardDescription>Por categoria no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {receitasPorCategoria.length > 0 ? (
              <ChartContainer config={receitasChartConfig} className="h-[300px]">
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
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma receita categorizada encontrada no período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Despesas por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
          <CardDescription>Principais gastos do período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          {despesasPorCategoria.length > 0 ? (
            <ChartContainer config={despesasChartConfig} className="h-[300px]">
              <BarChart data={despesasPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(0 84.2% 60.2%)" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhuma despesa categorizada encontrada no período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Extratos</CardTitle>
          <CardDescription>Acompanhe o processamento dos arquivos</CardDescription>
        </CardHeader>
        <CardContent>
          {extratos.length > 0 ? (
            <div className="space-y-4">
              {extratos.slice(0, 5).map((extrato) => (
                <div key={extrato.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{extrato.name}</p>
                      <p className="text-sm text-muted-foreground">{extrato.bank} - {extrato.period}</p>
                    </div>
                  </div>
                  <Badge 
                    className={
                      extrato.status === 'processado' ? 'bg-primary' : 
                      extrato.status === 'processando' ? 'bg-secondary' : 
                      'bg-destructive'
                    }
                  >
                    {extrato.status === 'processado' ? 'Processado' : 
                     extrato.status === 'processando' ? 'Processando' : 'Erro'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum extrato processado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
