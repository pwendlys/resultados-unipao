import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ComparisonData, ItemComparison } from '@/hooks/useBalanceComparison';
import { formatCurrency } from '@/utils/financialProcessor';

interface ComparisonTableProps {
  data: ComparisonData;
}

const ComparisonTable = ({ data }: ComparisonTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [trendFilter, setTrendFilter] = useState<'all' | 'melhorou' | 'piorou' | 'manteve'>('all');
  const [sortBy, setSortBy] = useState<'codigo' | 'variacao_monetaria' | 'variacao_percentual'>('variacao_monetaria');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrar e ordenar dados
  const filteredData = data.itemsComparison
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        (item.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTrend = trendFilter === 'all' || item.trend === trendFilter;
      
      return matchesSearch && matchesTrend;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'codigo':
          aValue = a.codigo || a.descricao || '';
          bValue = b.codigo || b.descricao || '';
          break;
        case 'variacao_monetaria':
          aValue = a.variacao_monetaria || 0;
          bValue = b.variacao_monetaria || 0;
          break;
        case 'variacao_percentual':
          aValue = a.variacao_percentual || 0;
          bValue = b.variacao_percentual || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const getTrendIcon = (trend: ItemComparison['trend']) => {
    switch (trend) {
      case 'melhorou':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'piorou':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: ItemComparison['trend']) => {
    switch (trend) {
      case 'melhorou':
        return <Badge variant="default" className="bg-green-100 text-green-800">Melhorou</Badge>;
      case 'piorou':
        return <Badge variant="destructive">Piorou</Badge>;
      default:
        return <Badge variant="secondary">Manteve</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ['Código', 'Descrição', ...data.balances.map(b => b.periodo), 'Variação', 'Tendência'];
    const rows = filteredData.map(item => [
      item.codigo || '',
      item.descricao || '',
      ...data.balances.map(b => formatCurrency(item.balances[b.id]?.diferenca_monetaria || 0)),
      formatCurrency(item.variacao_monetaria || 0),
      item.trend === 'melhorou' ? 'Melhorou' : item.trend === 'piorou' ? 'Piorou' : 'Manteve'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comparacao_balancos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação Detalhada de Itens</CardTitle>
        <CardDescription>
          Análise item por item entre os períodos selecionados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={trendFilter} onValueChange={(value: any) => setTrendFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por tendência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="melhorou">Melhorou</SelectItem>
              <SelectItem value="piorou">Piorou</SelectItem>
              <SelectItem value="manteve">Manteve</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="codigo">Código</SelectItem>
              <SelectItem value="variacao_monetaria">Variação R$</SelectItem>
              <SelectItem value="variacao_percentual">Variação %</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                {data.balances.map(balance => (
                  <TableHead key={balance.id} className="text-center">
                    {balance.periodo}
                  </TableHead>
                ))}
                <TableHead className="text-center">Variação</TableHead>
                <TableHead className="text-center">Tendência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.codigo || '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.descricao || '-'}
                  </TableCell>
                  {data.balances.map(balance => (
                    <TableCell key={balance.id} className="text-center">
                      <span className={
                        (item.balances[balance.id]?.diferenca_monetaria || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }>
                        {formatCurrency(item.balances[balance.id]?.diferenca_monetaria || 0)}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={
                        (item.variacao_monetaria || 0) >= 0 
                          ? 'text-red-600 font-medium' 
                          : 'text-green-600 font-medium'
                      }>
                        {formatCurrency(item.variacao_monetaria || 0)}
                      </span>
                      {item.variacao_percentual !== 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({item.variacao_percentual > 0 ? '+' : ''}{item.variacao_percentual?.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getTrendIcon(item.trend)}
                      {getTrendBadge(item.trend)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum item encontrado com os filtros aplicados.
            </p>
          </div>
        )}

        {filteredData.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredData.length} de {data.itemsComparison.length} itens
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparisonTable;