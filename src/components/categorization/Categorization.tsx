import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search,
  Filter,
  CheckCircle,
  Clock,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useTransactions, 
  useTransactionsActions,
  Transaction 
} from '@/hooks/useSupabaseData';
import { useCategories } from '@/hooks/useCategories';

const Categorization = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, { category: string; status: string; observacao?: string }>>(new Map());

  const { toast } = useToast();
  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = useTransactions();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { updateTransaction, bulkUpdateTransactions } = useTransactionsActions();

  // Adicionar effect para refetch quando o componente monta
  useEffect(() => {
    console.log('Categorization component mounted, refetching transactions');
    refetchTransactions();
  }, [refetchTransactions]);

  // Adicionar log quando as transações mudam
  useEffect(() => {
    console.log('Transactions loaded in Categorization:', transactions.length);
  }, [transactions]);

  const categoriasSaida = categories.filter(c => c.type === 'saida').map(c => c.name);
  const categoriasEntrada = categories.filter(c => c.type === 'entrada').map(c => c.name);

  const updateTransactionCategory = (id: string, category: string) => {
    const status = category ? 'categorizado' : 'pendente';
    setPendingUpdates(prev => {
      const newUpdates = new Map(prev);
      const existing = newUpdates.get(id) || {};
      newUpdates.set(id, { ...existing, category, status });
      return newUpdates;
    });
  };

  const updateTransactionObservacao = (id: string, observacao: string) => {
    setPendingUpdates(prev => {
      const newUpdates = new Map(prev);
      const existing = newUpdates.get(id) || { category: '', status: 'pendente' };
      newUpdates.set(id, { ...existing, observacao });
      return newUpdates;
    });
  };

  const getSuggestedCategory = (description: string, type: string) => {
    const desc = description.toLowerCase();
    
    if (type === 'saida') {
      if (desc.includes('maria silva') || desc.includes('joao') || desc.includes('salario') || desc.includes('pagamento')) return 'Folha de Pagamento';
      if (desc.includes('imobiliaria') || desc.includes('aluguel')) return 'Aluguel';
      if (desc.includes('eletrica') || desc.includes('agua') || desc.includes('internet') || desc.includes('luz')) return 'Internet/Água/Luz';
      if (desc.includes('transporte') || desc.includes('vale')) return 'Vale Transporte';
      if (desc.includes('encargo') || desc.includes('inss') || desc.includes('fgts')) return 'Encargos Sociais';
      if (desc.includes('servico') || desc.includes('terceiro')) return 'Serviços de Terceiros';
    } else {
      if (desc.includes('cooperado')) return 'Mensalidade';
      if (desc.includes('taxa') || desc.includes('administrativa')) return 'Taxa Administrativa';
    }
    
    return '';
  };

  const applySuggestions = () => {
    const newUpdates = new Map(pendingUpdates);
    
    transactions.forEach(t => {
      if (t.status === 'pendente' && !t.category) {
        const suggested = getSuggestedCategory(t.description, t.type);
        if (suggested) {
          const existing = newUpdates.get(t.id) || {};
          newUpdates.set(t.id, {
            ...existing,
            category: suggested,
            status: 'categorizado'
          });
        }
      }
    });
    
    setPendingUpdates(newUpdates);
    
    toast({
      title: "Sugestões Aplicadas",
      description: `${newUpdates.size} transações com sugestões aplicadas.`,
    });
  };

  const saveChanges = async () => {
    if (pendingUpdates.size === 0) {
      toast({
        title: "Nenhuma Alteração",
        description: "Não há alterações para salvar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates = Array.from(pendingUpdates.entries()).map(([id, data]) => ({
        id,
        category: data.category,
        status: data.status,
        observacao: data.observacao
      }));

      // Atualizar transações uma por uma para incluir observação
      for (const update of updates) {
        await updateTransaction.mutateAsync(update);
      }
      
      setPendingUpdates(new Map());
      
      toast({
        title: "Sucesso",
        description: `${updates.length} transações atualizadas.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao salvar alterações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  };

  const getTransactionCategory = (transaction: Transaction): string => {
    const pending = pendingUpdates.get(transaction.id);
    return pending?.category || transaction.category || '';
  };

  const getTransactionStatus = (transaction: Transaction): string => {
    const pending = pendingUpdates.get(transaction.id);
    return pending?.status || transaction.status;
  };

  const getTransactionObservacao = (transaction: Transaction): string => {
    const pending = pendingUpdates.get(transaction.id);
    return pending?.observacao || transaction.observacao || '';
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const currentStatus = getTransactionStatus(t);
    const matchesStatus = filterStatus === 'all' || currentStatus === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const pendingCount = transactions.filter(t => getTransactionStatus(t) === 'pendente').length;
  const categorizedCount = transactions.filter(t => getTransactionStatus(t) === 'categorizado').length;

  if (transactionsLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando transações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categorização de Movimentações</h1>
          <p className="text-muted-foreground">
            Categorize as transações extraídas dos extratos bancários
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={applySuggestions}>
            Aplicar Sugestões
          </Button>
          <Button 
            className="bg-primary"
            onClick={saveChanges}
            disabled={pendingUpdates.size === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações {pendingUpdates.size > 0 && `(${pendingUpdates.size})`}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Todas as transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{categorizedCount}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.length > 0 ? ((categorizedCount / transactions.length) * 100).toFixed(0) : 0}% concluído
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando categorização</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar transação</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite descrição, valor ou beneficiário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="categorizado">Categorizados</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            Clique em uma transação para categorizar ou alterar a categoria e adicionar observações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada. Faça upload de um extrato primeiro.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const currentCategory = getTransactionCategory(transaction);
                const currentStatus = getTransactionStatus(transaction);
                const currentObservacao = getTransactionObservacao(transaction);
                const hasPendingChanges = pendingUpdates.has(transaction.id);
                
                return (
                  <div
                    key={transaction.id}
                    className={cn(
                      "border rounded-lg p-4 space-y-3 transition-colors",
                      currentStatus === 'pendente' 
                        ? "border-secondary/50 bg-secondary/5" 
                        : "border-border hover:bg-muted/50",
                      hasPendingChanges && "ring-2 ring-primary/20 bg-primary/5"
                    )}
                  >
                    {/* Transaction Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Type Icon */}
                        {transaction.type === 'entrada' ? (
                          <ArrowUpCircle className="h-6 w-6 text-primary" />
                        ) : (
                          <ArrowDownCircle className="h-6 w-6 text-destructive" />
                        )}
                        
                        {/* Transaction Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{transaction.description}</p>
                            {transaction.suggested && (
                              <Badge variant="outline" className="text-xs">
                                Sugerido
                              </Badge>
                            )}
                            {hasPendingChanges && (
                              <Badge variant="outline" className="text-xs bg-primary/10">
                                Alterado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                        
                        {/* Amount */}
                        <div className="text-right">
                          <p className={cn(
                            "font-bold",
                            transaction.type === 'entrada' ? "text-primary" : "text-destructive"
                          )}>
                            {transaction.type === 'entrada' ? '+' : '-'} R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="ml-4">
                        {currentStatus === 'categorizado' ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <Clock className="h-5 w-5 text-secondary" />
                        )}
                      </div>
                    </div>

                    {/* Category and Observation Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Category Selection */}
                      <div>
                        <Label className="text-sm font-medium">Categoria</Label>
                        <Select 
                          value={currentCategory} 
                          onValueChange={(value) => updateTransactionCategory(transaction.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {transaction.type === 'entrada' 
                              ? categoriasEntrada.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))
                              : categoriasSaida.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Observation Field */}
                      <div>
                        <Label className="text-sm font-medium">Observação</Label>
                        <Textarea
                          placeholder="Adicione uma observação..."
                          value={currentObservacao}
                          onChange={(e) => updateTransactionObservacao(transaction.id, e.target.value)}
                          className="min-h-[40px] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Categorization;
