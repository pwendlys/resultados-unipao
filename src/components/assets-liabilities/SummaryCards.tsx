import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { AssetsLiabilities } from '@/hooks/useAssetsLiabilities';

interface SummaryCardsProps {
  data?: AssetsLiabilities;
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalAtivos = data 
    ? Number(data.saldo_do_dia) + Number(data.a_receber) + Number(data.vencida) + Number(data.estoque) + Number(data.investimento)
    : 0;

  const totalPassivos = data 
    ? Number(data.a_pagar) + Number(data.joia) + Number(data.aporte)
    : 0;

  const resultado = totalAtivos - totalPassivos;

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum registro encontrado. Clique em "Novo Registro" para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAtivos)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Data: {new Date(data.data_referencia).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        {/* Total Passivos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Passivos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPassivos)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Data: {new Date(data.data_referencia).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado</CardTitle>
            <DollarSign className={`h-4 w-4 ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(resultado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resultado >= 0 ? 'Patrimônio positivo' : 'Patrimônio negativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalhamento Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Detalhamento dos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Saldo do Dia</span>
                <span className="font-medium">{formatCurrency(Number(data.saldo_do_dia))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">A Receber</span>
                <span className="font-medium">{formatCurrency(Number(data.a_receber))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vencida</span>
                <span className="font-medium">{formatCurrency(Number(data.vencida))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estoque</span>
                <span className="font-medium">{formatCurrency(Number(data.estoque))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Investimento</span>
                <span className="font-medium">{formatCurrency(Number(data.investimento))}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-bold">Total</span>
                <span className="font-bold text-green-600">{formatCurrency(totalAtivos)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhamento Passivos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Detalhamento dos Passivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">A Pagar</span>
                <span className="font-medium">{formatCurrency(Number(data.a_pagar))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Joia</span>
                <span className="font-medium">{formatCurrency(Number(data.joia))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Aporte</span>
                <span className="font-medium">{formatCurrency(Number(data.aporte))}</span>
              </div>
              <div className="flex justify-between pt-3 border-t mt-auto">
                <span className="font-bold">Total</span>
                <span className="font-bold text-red-600">{formatCurrency(totalPassivos)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {data.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
