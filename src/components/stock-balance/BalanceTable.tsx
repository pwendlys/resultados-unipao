import { useState, useMemo } from 'react';
import { Search, Settings, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/utils/stockBalanceProcessor';
import type { ItemBalanco } from '@/hooks/useStockBalance';

interface BalanceTableProps {
  itens: ItemBalanco[];
}

type SortField = keyof ItemBalanco;
type SortDirection = 'asc' | 'desc';

const BalanceTable = ({ itens }: BalanceTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('diferenca_quantidade');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedItens = useMemo(() => {
    let filtered = itens;

    // Apply search filter
    if (searchTerm) {
      filtered = itens.filter(item => 
        (item.codigo && item.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.descricao && item.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = 0;
      if (bValue === null || bValue === undefined) bValue = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [itens, searchTerm, sortField, sortDirection]);

  const paginatedItens = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItens.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItens, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedItens.length / itemsPerPage);

  const getDiferencaStatus = (diferenca?: number) => {
    if (!diferenca) return 'neutro';
    if (diferenca > 0) return 'positivo';
    return 'negativo';
  };

  const getDiferencaBadge = (diferenca?: number) => {
    const status = getDiferencaStatus(diferenca);
    const variant = status === 'positivo' ? 'default' : status === 'negativo' ? 'destructive' : 'secondary';
    
    return (
      <Badge variant={variant}>
        {status === 'positivo' ? 'Superávit' : status === 'negativo' ? 'Déficit' : 'Neutro'}
      </Badge>
    );
  };

  const formatValue = (value: any, type: 'text' | 'number' | 'currency' = 'text') => {
    if (value === null || value === undefined || value === '') {
      return type === 'text' ? 'Sem informação' : '—';
    }

    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      default:
        return value;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Tabela de Itens</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por código ou descrição..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('codigo')}
                      className="h-auto p-0 font-semibold"
                    >
                      Código
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('descricao')}
                      className="h-auto p-0 font-semibold"
                    >
                      Descrição
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('quantidade_sistema')}
                      className="h-auto p-0 font-semibold"
                    >
                      Qtd Sistema
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('quantidade_real')}
                      className="h-auto p-0 font-semibold"
                    >
                      Qtd Real
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('diferenca_quantidade')}
                      className="h-auto p-0 font-semibold"
                    >
                      Diferença
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('unitario')}
                      className="h-auto p-0 font-semibold"
                    >
                      Preço Unit.
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('diferenca_monetaria')}
                      className="h-auto p-0 font-semibold"
                    >
                      Impacto Monetário
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {formatValue(item.codigo)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {formatValue(item.descricao)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(item.quantidade_sistema, 'number')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(item.quantidade_real, 'number')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={
                        getDiferencaStatus(item.diferenca_quantidade) === 'positivo' 
                          ? 'text-green-600' 
                          : getDiferencaStatus(item.diferenca_quantidade) === 'negativo'
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      }>
                        {formatValue(item.diferenca_quantidade, 'number')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(item.unitario, 'currency')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={
                        (item.diferenca_monetaria || 0) > 0 
                          ? 'text-green-600' 
                          : (item.diferenca_monetaria || 0) < 0
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      }>
                        {formatValue(item.diferenca_monetaria, 'currency')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getDiferencaBadge(item.diferenca_quantidade)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAndSortedItens.length)} de {filteredAndSortedItens.length} itens
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceTable;