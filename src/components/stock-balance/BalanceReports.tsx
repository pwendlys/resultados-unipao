import { useState } from 'react';
import { Download, FileText, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/utils/stockBalanceProcessor';
import { useToast } from '@/hooks/use-toast';
import type { ItemBalanco, BalancoEstoque } from '@/hooks/useStockBalance';
import * as XLSX from 'xlsx';
import { generateBalancePDF } from '@/utils/balancePdfGenerator';

interface BalanceReportsProps {
  itens: ItemBalanco[];
  balanco: BalancoEstoque;
}

type ReportFilter = 'all' | 'discrepancies' | 'surplus' | 'deficit' | 'no_price';

const BalanceReports = ({ itens, balanco }: BalanceReportsProps) => {
  const [selectedReport, setSelectedReport] = useState('discrepancies');
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all');
  const { toast } = useToast();

  const getFilteredItems = () => {
    let filtered = itens;

    switch (reportFilter) {
      case 'discrepancies':
        filtered = itens.filter(item => (item.diferenca_quantidade || 0) !== 0);
        break;
      case 'surplus':
        filtered = itens.filter(item => (item.diferenca_quantidade || 0) > 0);
        break;
      case 'deficit':
        filtered = itens.filter(item => (item.diferenca_quantidade || 0) < 0);
        break;
      case 'no_price':
        filtered = itens.filter(item => !item.unitario || item.unitario === 0);
        break;
      default:
        filtered = itens;
    }

    if (selectedReport === 'top_discrepancies') {
      filtered = filtered
        .filter(item => item.diferenca_quantidade !== undefined && item.diferenca_quantidade !== null)
        .sort((a, b) => Math.abs(b.diferenca_quantidade || 0) - Math.abs(a.diferenca_quantidade || 0))
        .slice(0, 20);
    }

    return filtered;
  };

  const exportToExcel = (data: ItemBalanco[], filename: string) => {
    try {
      const exportData = data.map(item => ({
        'Código': item.codigo || 'Sem informação',
        'Descrição': item.descricao || 'Sem informação',
        'Quantidade Sistema': item.quantidade_sistema || 0,
        'Quantidade Real': item.quantidade_real || 0,
        'Diferença (Qtd vs Real)': item.diferenca_quantidade || 0,
        'Preço Unitário': item.unitario || 0,
        'Valor Sistema': item.valor_sistema || 0,
        'Valor Real': item.valor_real || 0,
        'Diferença Monetária': item.diferenca_monetaria || 0,
        'Status': (item.diferenca_quantidade || 0) > 0 ? 'Superávit' : 
                 (item.diferenca_quantidade || 0) < 0 ? 'Déficit' : 'Neutro'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
      
      // Add metadata
      const metadata = [
        ['Relatório de Balanço de Estoque', ''],
        ['Arquivo:', balanco.nome],
        ['Período:', balanco.periodo],
        ['Data de Geração:', new Date().toLocaleString('pt-BR')],
        ['Total de Itens:', data.length],
        ['', '']
      ];
      
      XLSX.utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });
      XLSX.utils.sheet_add_json(ws, exportData, { origin: 'A8' });
      
      XLSX.writeFile(wb, `${filename}.xlsx`);
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generateBalancePDF(filteredItems, balanco);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const filteredItems = getFilteredItems();

  const getDiferencaBadge = (diferenca?: number) => {
    if (!diferenca) return <Badge variant="secondary">Neutro</Badge>;
    return diferenca > 0 
      ? <Badge variant="default">Superávit</Badge>
      : <Badge variant="destructive">Déficit</Badge>;
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios Disponíveis
            </CardTitle>
            <CardDescription>
              Selecione o tipo de relatório que deseja gerar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discrepancies">Itens com Discrepância</SelectItem>
                  <SelectItem value="top_discrepancies">Maiores Diferenças (Top 20)</SelectItem>
                  <SelectItem value="complete">Relatório Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filtros</label>
              <Select value={reportFilter} onValueChange={(value) => setReportFilter(value as ReportFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Itens</SelectItem>
                  <SelectItem value="discrepancies">Apenas com Discrepância</SelectItem>
                  <SelectItem value="surplus">Apenas Superávit</SelectItem>
                  <SelectItem value="deficit">Apenas Déficit</SelectItem>
                  <SelectItem value="no_price">Sem Preço Unitário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => exportToExcel(filteredItems, `relatorio_balanco_${balanco.periodo.replace(/\s+/g, '_')}`)}
                className="w-full"
                disabled={filteredItems.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar para Excel
              </Button>
              
              <Button 
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full"
                disabled={filteredItems.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Baixar PDF do Balanço
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Relatório</CardTitle>
            <CardDescription>
              Informações sobre os dados filtrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{filteredItems.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Com Discrepância</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredItems.filter(item => (item.diferenca_quantidade || 0) !== 0).length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Em Déficit</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredItems.filter(item => (item.diferenca_quantidade || 0) < 0).length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Em Superávit</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredItems.filter(item => (item.diferenca_quantidade || 0) > 0).length}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Impacto Monetário Total</p>
                <p className={`text-xl font-bold ${
                  filteredItems.reduce((sum, item) => sum + (item.diferenca_monetaria || 0), 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(filteredItems.reduce((sum, item) => sum + (item.diferenca_monetaria || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prévia do Relatório</CardTitle>
          <CardDescription>
            {selectedReport === 'discrepancies' && 'Itens que apresentam diferenças entre quantidade sistema e real'}
            {selectedReport === 'top_discrepancies' && 'Top 20 itens com maiores discrepâncias absolutas'}
            {selectedReport === 'complete' && 'Relatório completo com todos os itens'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Qtd Sistema</TableHead>
                  <TableHead className="text-right">Qtd Real</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Impacto Monetário</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.slice(0, 10).map((item) => (
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
                        (item.diferenca_quantidade || 0) > 0 ? 'text-green-600' : 
                        (item.diferenca_quantidade || 0) < 0 ? 'text-red-600' : 'text-muted-foreground'
                      }>
                        {formatValue(item.diferenca_quantidade, 'number')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(item.unitario, 'currency')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={
                        (item.diferenca_monetaria || 0) > 0 ? 'text-green-600' : 
                        (item.diferenca_monetaria || 0) < 0 ? 'text-red-600' : 'text-muted-foreground'
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
            
            {filteredItems.length > 10 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                ... e mais {filteredItems.length - 10} itens. Use a exportação para ver todos os dados.
              </div>
            )}
            
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p>Nenhum item encontrado com os filtros selecionados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceReports;