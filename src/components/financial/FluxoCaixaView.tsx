import React, { useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ItemFinanceiro } from '@/hooks/useFinancialData';

interface FluxoCaixaViewProps {
  itens: ItemFinanceiro[];
}

interface FluxoCaixaData {
  data: string;
  saldo_dia: number;
  a_pagar: number;
  a_receber: number;
  saldo_final: number;
  situacao: string;
}

const FluxoCaixaView: React.FC<FluxoCaixaViewProps> = ({ itens }) => {
  // Extrair dados de fluxo de caixa dos itens
  const dadosFluxo = useMemo(() => {
    return itens
      .filter(item => item.observacao && item.observacao.includes('tipo_fluxo'))
      .map(item => {
        try {
          const observacao = JSON.parse(item.observacao || '{}');
          return {
            data: item.data_vencimento || '',
            saldo_dia: observacao.saldo_dia || 0,
            a_pagar: observacao.a_pagar || 0,
            a_receber: observacao.a_receber || 0,
            saldo_final: observacao.saldo_final || 0,
            situacao: observacao.situacao || 'Normal',
            descricao: item.descricao
          } as FluxoCaixaData & { descricao: string };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a!.data).getTime() - new Date(b!.data).getTime()) as (FluxoCaixaData & { descricao: string })[];
  }, [itens]);

  // Calcular métricas do fluxo de caixa
  const metricas = useMemo(() => {
    if (dadosFluxo.length === 0) {
      return {
        saldoInicial: 0,
        saldoFinal: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        maiorSaldo: 0,
        menorSaldo: 0,
        variacao: 0
      };
    }

    const saldoInicial = dadosFluxo[0]?.saldo_dia || 0;
    const saldoFinal = dadosFluxo[dadosFluxo.length - 1]?.saldo_final || 0;
    const totalEntradas = dadosFluxo.reduce((sum, item) => sum + item.a_receber, 0);
    const totalSaidas = dadosFluxo.reduce((sum, item) => sum + item.a_pagar, 0);
    const saldos = dadosFluxo.map(item => item.saldo_final);
    const maiorSaldo = Math.max(...saldos);
    const menorSaldo = Math.min(...saldos);
    const variacao = saldoFinal - saldoInicial;

    return {
      saldoInicial,
      saldoFinal,
      totalEntradas,
      totalSaidas,
      maiorSaldo,
      menorSaldo,
      variacao
    };
  }, [dadosFluxo]);

  // Dados para gráficos
  const dadosGrafico = useMemo(() => {
    return dadosFluxo.map(item => ({
      data: new Date(item.data).toLocaleDateString('pt-BR'),
      saldo: item.saldo_final,
      entradas: item.a_receber,
      saidas: item.a_pagar,
      situacao: item.situacao
    }));
  }, [dadosFluxo]);

  const getSituacaoBadge = (situacao: string) => {
    const situacaoLower = situacao.toLowerCase();
    if (situacaoLower.includes('real')) {
      return <Badge className="bg-success/10 text-success">Real</Badge>;
    }
    if (situacaoLower.includes('prev')) {
      return <Badge className="bg-primary/10 text-primary">Previsto</Badge>;
    }
    if (situacaoLower.includes('ovos')) {
      return <Badge className="bg-warning/10 text-warning">Prev + Ovos</Badge>;
    }
    return <Badge variant="secondary">{situacao}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    });
  };

  if (dadosFluxo.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum dado de fluxo de caixa encontrado. 
            Faça upload de um arquivo de fluxo de caixa para visualizar os dados aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metricas.saldoInicial)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metricas.variacao >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(metricas.saldoFinal)}
            </div>
            <p className={`text-xs ${metricas.variacao >= 0 ? 'text-success' : 'text-destructive'}`}>
              {metricas.variacao >= 0 ? '+' : ''}{formatCurrency(metricas.variacao)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(metricas.totalEntradas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(metricas.totalSaidas)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entradas vs Saídas Diárias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="entradas" fill="hsl(var(--success))" name="Entradas" />
                <Bar dataKey="saidas" fill="hsl(var(--destructive))" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fluxo de Caixa Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Saldo Inicial</TableHead>
                  <TableHead>Entradas</TableHead>
                  <TableHead>Saídas</TableHead>
                  <TableHead>Saldo Final</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFluxo.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{formatCurrency(item.saldo_dia)}</TableCell>
                    <TableCell className="text-success font-medium">
                      {formatCurrency(item.a_receber)}
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      {formatCurrency(item.a_pagar)}
                    </TableCell>
                    <TableCell className={`font-bold ${item.saldo_final >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(item.saldo_final)}
                    </TableCell>
                    <TableCell>
                      {getSituacaoBadge(item.situacao)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FluxoCaixaView;