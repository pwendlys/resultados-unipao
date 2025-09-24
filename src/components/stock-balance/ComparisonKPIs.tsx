import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { ComparisonKPIs as ComparisonKPIsType } from '@/hooks/useBalanceComparison';
import { formatCurrency } from '@/utils/financialProcessor';

interface ComparisonKPIsProps {
  kpis: ComparisonKPIsType;
  periodNames: string[];
}

const ComparisonKPIs = ({ kpis, periodNames }: ComparisonKPIsProps) => {
  const renderTrendIcon = (variacao: number) => {
    if (variacao > 0) return <ArrowUp className="h-4 w-4 text-red-500" />;
    if (variacao < 0) return <ArrowDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const renderVariationBadge = (variacao: number, isMonetary: boolean = false) => {
    const value = isMonetary ? formatCurrency(Math.abs(variacao)) : Math.abs(variacao).toString();
    const prefix = variacao > 0 ? '+' : variacao < 0 ? '-' : '';
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    if (variacao > 0) variant = "destructive";
    if (variacao < 0) variant = "default";

    return (
      <Badge variant={variant} className="ml-2">
        {prefix}{value}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Evolução do Resultado Monetário */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resultado Monetário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{periodNames[0]}:</span>
              <span className={kpis.evolucao_resultado.inicial >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(kpis.evolucao_resultado.inicial)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{periodNames[periodNames.length - 1]}:</span>
              <span className={kpis.evolucao_resultado.final >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(kpis.evolucao_resultado.final)}
              </span>
            </div>
            <div className="flex items-center pt-2 border-t">
              {renderTrendIcon(kpis.evolucao_resultado.variacao)}
              <span className="text-sm text-muted-foreground ml-1">Variação:</span>
              {renderVariationBadge(kpis.evolucao_resultado.variacao, true)}
            </div>
            {kpis.evolucao_resultado.variacao_percentual !== 0 && (
              <div className="text-xs text-muted-foreground">
                ({kpis.evolucao_resultado.variacao_percentual > 0 ? '+' : ''}{kpis.evolucao_resultado.variacao_percentual.toFixed(1)}%)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Evolução Itens Positivos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Itens Positivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{periodNames[0]}:</span>
              <span className="font-medium">{kpis.evolucao_itens.positivos.inicial}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{periodNames[periodNames.length - 1]}:</span>
              <span className="font-medium">{kpis.evolucao_itens.positivos.final}</span>
            </div>
            <div className="flex items-center pt-2 border-t">
              {renderTrendIcon(kpis.evolucao_itens.positivos.variacao)}
              <span className="text-sm text-muted-foreground ml-1">Variação:</span>
              {renderVariationBadge(kpis.evolucao_itens.positivos.variacao)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolução Itens Negativos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Itens Negativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{periodNames[0]}:</span>
              <span className="font-medium text-red-600">{kpis.evolucao_itens.negativos.inicial}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{periodNames[periodNames.length - 1]}:</span>
              <span className="font-medium text-red-600">{kpis.evolucao_itens.negativos.final}</span>
            </div>
            <div className="flex items-center pt-2 border-t">
              {renderTrendIcon(-kpis.evolucao_itens.negativos.variacao)} {/* Invertido: menos negativos = melhor */}
              <span className="text-sm text-muted-foreground ml-1">Variação:</span>
              {renderVariationBadge(kpis.evolucao_itens.negativos.variacao)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolução Itens Neutros */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Itens Neutros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{periodNames[0]}:</span>
              <span className="font-medium">{kpis.evolucao_itens.neutros.inicial}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{periodNames[periodNames.length - 1]}:</span>
              <span className="font-medium">{kpis.evolucao_itens.neutros.final}</span>
            </div>
            <div className="flex items-center pt-2 border-t">
              {renderTrendIcon(kpis.evolucao_itens.neutros.variacao)}
              <span className="text-sm text-muted-foreground ml-1">Variação:</span>
              {renderVariationBadge(kpis.evolucao_itens.neutros.variacao)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonKPIs;