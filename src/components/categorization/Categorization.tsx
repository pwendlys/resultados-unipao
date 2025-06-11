
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

const Categorization = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Categorias disponíveis
  const categoriasSaida = [
    'Folha de Pagamento',
    'Vale Transporte', 
    'Adiantamento',
    'Aluguel',
    'Internet/Água/Luz',
    'Encargos Sociais',
    'Serviços de Terceiros',
    'Fretes/Mat. Escritório/Café'
  ];

  const categoriasEntrada = [
    'Mensalidade',
    'Taxa Administrativa'
  ];

  // Transações mockadas
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: '2024-03-15',
      description: 'PIX ENVIADO - MARIA SILVA SANTOS',
      amount: -3500.00,
      type: 'saida',
      category: 'Folha de Pagamento',
      status: 'categorizado',
      suggested: true
    },
    {
      id: 2,
      date: '2024-03-14',
      description: 'TED RECEBIDO - COOPERADO JOÃO SILVA',
      amount: 1200.00,
      type: 'entrada',
      category: 'Mensalidade',
      status: 'categorizado',
      suggested: true
    },
    {
      id: 3,
      date: '2024-03-13',
      description: 'DOC ENVIADO - IMOBILIARIA SAO PAULO LTDA',
      amount: -2500.00,
      type: 'saida',
      category: '',
      status: 'pendente',
      suggested: false
    },
    {
      id: 4,
      date: '2024-03-12',
      description: 'PIX RECEBIDO - COOPERADO MARIA OLIVEIRA',
      amount: 850.00,
      type: 'entrada',
      category: '',
      status: 'pendente',
      suggested: false
    },
    {
      id: 5,
      date: '2024-03-11',
      description: 'DEBITO AUTOMATICO - COMPANHIA ELETRICA',
      amount: -420.50,
      type: 'saida',
      category: '',
      status: 'pendente',
      suggested: false
    }
  ]);

  const updateTransactionCategory = (id: number, category: string) => {
    setTransactions(prev => 
      prev.map(t => 
        t.id === id 
          ? { ...t, category, status: category ? 'categorizado' : 'pendente' }
          : t
      )
    );
  };

  const getSuggestedCategory = (description: string, type: string) => {
    const desc = description.toLowerCase();
    
    if (type === 'saida') {
      if (desc.includes('maria silva') || desc.includes('joao')) return 'Folha de Pagamento';
      if (desc.includes('imobiliaria') || desc.includes('aluguel')) return 'Aluguel';
      if (desc.includes('eletrica') || desc.includes('agua') || desc.includes('internet')) return 'Internet/Água/Luz';
      if (desc.includes('transporte') || desc.includes('vale')) return 'Vale Transporte';
    } else {
      if (desc.includes('cooperado')) return 'Mensalidade';
      if (desc.includes('taxa') || desc.includes('administrativa')) return 'Taxa Administrativa';
    }
    
    return '';
  };

  const applySuggestions = () => {
    setTransactions(prev => 
      prev.map(t => {
        if (t.status === 'pendente' && !t.category) {
          const suggested = getSuggestedCategory(t.description, t.type);
          return {
            ...t,
            category: suggested,
            status: suggested ? 'categorizado' : 'pendente',
            suggested: !!suggested
          };
        }
        return t;
      })
    );
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const pendingCount = transactions.filter(t => t.status === 'pendente').length;
  const categorizedCount = transactions.filter(t => t.status === 'categorizado').length;

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
          <Button className="bg-primary">
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
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
            <p className="text-xs text-muted-foreground">Extrato atual</p>
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
              {((categorizedCount / transactions.length) * 100).toFixed(0)}% concluído
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
            Clique em uma transação para categorizar ou alterar a categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg transition-colors",
                  transaction.status === 'pendente' 
                    ? "border-secondary/50 bg-secondary/5" 
                    : "border-border hover:bg-muted/50"
                )}
              >
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

                {/* Category Selection */}
                <div className="ml-4 min-w-[200px]">
                  <Select 
                    value={transaction.category} 
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

                {/* Status */}
                <div className="ml-4">
                  {transaction.status === 'categorizado' ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <Clock className="h-5 w-5 text-secondary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Categorization;
