import React, { useState, useMemo } from 'react';
import { CalendarDays, Filter, Download, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAllItensFinanceiros, useDocumentosFinanceiros } from '@/hooks/useFinancialData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const RelatoriosFinanceiros: React.FC = () => {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pesquisa, setPesquisa] = useState('');

  const { data: itens, isLoading: loadingItens } = useAllItensFinanceiros();
  const { data: documentos, isLoading: loadingDocumentos } = useDocumentosFinanceiros();

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    if (!itens) return [];

    return itens.filter(item => {
      // Filtro por tipo de documento
      if (filtroTipo && filtroTipo !== 'todos') {
        const documento = documentos?.find(d => d.id === item.documento_id);
        if (!documento || documento.tipo_documento !== filtroTipo) return false;
      }

      // Filtro por status
      if (filtroStatus && filtroStatus !== 'todos' && item.status !== filtroStatus) return false;

      // Filtro por categoria
      if (filtroCategoria && filtroCategoria !== 'todas' && item.categoria !== filtroCategoria) return false;

      // Filtro por data de vencimento
      if (dataInicio && item.data_vencimento && item.data_vencimento < dataInicio) return false;
      if (dataFim && item.data_vencimento && item.data_vencimento > dataFim) return false;

      // Filtro por pesquisa
      if (pesquisa && !item.descricao.toLowerCase().includes(pesquisa.toLowerCase()) && 
          !item.numero_documento?.toLowerCase().includes(pesquisa.toLowerCase())) return false;

      return true;
    });
  }, [itens, documentos, filtroTipo, filtroStatus, filtroCategoria, dataInicio, dataFim, pesquisa]);

  // Calcular métricas
  const metricas = useMemo(() => {
    if (!dadosFiltrados || !documentos) return {
      totalAReceber: 0,
      totalAPagar: 0,
      totalVencido: 0,
      quantidadeTotal: 0
    };

    const contasAReceber = dadosFiltrados.filter(item => {
      const doc = documentos.find(d => d.id === item.documento_id);
      return doc?.tipo_documento === 'contas_a_receber';
    });

    const contasAPagar = dadosFiltrados.filter(item => {
      const doc = documentos.find(d => d.id === item.documento_id);
      return doc?.tipo_documento === 'contas_a_pagar';
    });

    const contasVencidas = dadosFiltrados.filter(item => {
      const doc = documentos.find(d => d.id === item.documento_id);
      return doc?.tipo_documento === 'contas_vencidas' || 
             (item.data_vencimento && new Date(item.data_vencimento) < new Date() && item.status === 'pendente');
    });

    return {
      totalAReceber: contasAReceber.reduce((sum, item) => sum + item.valor, 0),
      totalAPagar: contasAPagar.reduce((sum, item) => sum + item.valor, 0),
      totalVencido: contasVencidas.reduce((sum, item) => sum + item.valor, 0),
      quantidadeTotal: dadosFiltrados.length
    };
  }, [dadosFiltrados, documentos]);

  // Dados para gráficos
  const dadosGraficoTipo = useMemo(() => {
    if (!dadosFiltrados || !documentos) return [];

    const grupos = dadosFiltrados.reduce((acc, item) => {
      const doc = documentos.find(d => d.id === item.documento_id);
      const tipo = doc?.tipo_documento || 'outros';
      
      if (!acc[tipo]) {
        acc[tipo] = { nome: tipo, valor: 0, quantidade: 0 };
      }
      
      acc[tipo].valor += item.valor;
      acc[tipo].quantidade += 1;
      
      return acc;
    }, {} as Record<string, { nome: string; valor: number; quantidade: number }>);

    return Object.values(grupos).map(grupo => ({
      nome: grupo.nome.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      valor: grupo.valor,
      quantidade: grupo.quantidade
    }));
  }, [dadosFiltrados, documentos]);

  const dadosGraficoStatus = useMemo(() => {
    if (!dadosFiltrados) return [];

    const grupos = dadosFiltrados.reduce((acc, item) => {
      if (!acc[item.status]) {
        acc[item.status] = { nome: item.status, valor: 0, quantidade: 0 };
      }
      
      acc[item.status].valor += item.valor;
      acc[item.status].quantidade += 1;
      
      return acc;
    }, {} as Record<string, { nome: string; valor: number; quantidade: number }>);

    return Object.values(grupos);
  }, [dadosFiltrados]);

  const coresPie = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const categorias = useMemo(() => {
    if (!itens) return [];
    return [...new Set(itens.map(item => item.categoria).filter(Boolean))];
  }, [itens]);

  const exportarDados = () => {
    if (!dadosFiltrados.length) return;

    const csvContent = [
      'Descrição,Valor,Data Vencimento,Status,Categoria,Número Documento',
      ...dadosFiltrados.map(item => 
        `"${item.descricao}","${item.valor}","${item.data_vencimento || ''}","${item.status}","${item.categoria || ''}","${item.numero_documento || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_financeiro.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loadingItens || loadingDocumentos) {
    return <div className="p-6">Carregando relatórios financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e analise seus dados financeiros com filtros e métricas detalhadas
          </p>
        </div>
        <Button onClick={exportarDados} disabled={!dadosFiltrados.length}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="contas_a_receber">Contas a Receber</SelectItem>
                  <SelectItem value="contas_a_pagar">Contas a Pagar</SelectItem>
                  <SelectItem value="contas_vencidas">Contas Vencidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Pesquisar</Label>
              <Input
                placeholder="Descrição ou número..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {metricas.totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              R$ {metricas.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {metricas.totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {metricas.quantidadeTotal}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficoTipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGraficoStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                  label={(entry) => entry.nome}
                >
                  {dadosGraficoStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={coresPie[index % coresPie.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Itens Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          {dadosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Documento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosFiltrados.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell>R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        {item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          item.status === 'pago' ? 'default' :
                          item.status === 'vencido' ? 'destructive' :
                          item.status === 'cancelado' ? 'secondary' : 'outline'
                        }>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.categoria || '-'}</TableCell>
                      <TableCell>{item.numero_documento || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {dadosFiltrados.length > 50 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Mostrando primeiros 50 itens de {dadosFiltrados.length} total
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum item encontrado com os filtros aplicados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosFinanceiros;