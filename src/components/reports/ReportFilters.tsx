import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  Filter,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type AccountType = 'BOLETOS' | 'MENSALIDADES E TX ADM' | 'APORTE E JOIA' | 'Cora' | 'ALL';

export const ACCOUNT_TYPES: { value: AccountType; label: string; description: string }[] = [
  {
    value: 'ALL',
    label: 'Todas as Contas',
    description: 'Consolidado de todas as contas'
  },
  {
    value: 'BOLETOS',
    label: 'Boletos',
    description: 'Boletos e pagamentos das mercadorias'
  },
  {
    value: 'MENSALIDADES E TX ADM',
    label: 'Mensalidades e Tx Adm',
    description: 'Mensalidades de taxas administrativas e despesas da cooperativa'
  },
  {
    value: 'APORTE E JOIA',
    label: 'Aporte e Joia',
    description: 'Aporte e joia dos cooperados e investimentos da cooperativa'
  },
  {
    value: 'Cora',
    label: 'Cora',
    description: 'Conta bancária Cora'
  }
];

interface ReportFiltersProps {
  selectedAccount: AccountType;
  onAccountChange: (account: AccountType) => void;
  dateFrom: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (date: Date | undefined) => void;
  onClearPeriodFilter: () => void;
}

export const ReportFilters = ({
  selectedAccount,
  onAccountChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearPeriodFilter
}: ReportFiltersProps) => {
  const getAccountBadge = (accountType: AccountType) => {
    const account = ACCOUNT_TYPES.find(type => type.value === accountType);
    const colors = {
      'ALL': 'bg-gray-100 text-gray-800',
      'BOLETOS': 'bg-blue-100 text-blue-800',
      'MENSALIDADES E TX ADM': 'bg-orange-100 text-orange-800',
      'APORTE E JOIA': 'bg-green-100 text-green-800',
      'Cora': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={`${colors[accountType]} text-sm px-3 py-1`}>
        {account?.label || accountType}
      </Badge>
    );
  };

  const getPeriodText = () => {
    if (!dateFrom && !dateTo) return 'Todos os períodos';
    if (dateFrom && dateTo) {
      return `${format(dateFrom, 'dd/MM/yyyy')} até ${format(dateTo, 'dd/MM/yyyy')}`;
    }
    if (dateFrom) {
      return `A partir de ${format(dateFrom, 'dd/MM/yyyy')}`;
    }
    if (dateTo) {
      return `Até ${format(dateTo, 'dd/MM/yyyy')}`;
    }
    return 'Todos os períodos';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Account Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar por Conta
          </CardTitle>
          <CardDescription>
            Selecione a conta para visualizar o resultado específico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedAccount} onValueChange={onAccountChange}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {ACCOUNT_TYPES.find(type => type.value === selectedAccount)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((account) => (
                    <SelectItem key={account.value} value={account.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{account.label}</span>
                        <span className="text-sm text-muted-foreground">{account.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Conta selecionada:</span>
              {getAccountBadge(selectedAccount)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Filtrar por Período
          </CardTitle>
          <CardDescription>
            Selecione o período das transações para análise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={onDateFromChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={onDateToChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Período: {getPeriodText()}
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearPeriodFilter}
                >
                  Limpar Filtro
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
