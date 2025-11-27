import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Calendar as CalendarIcon,
  Settings,
  Building2,
  Filter,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SendReportConfig } from './SendReports';
import { Category } from '@/hooks/useCategories';
import { ACCOUNT_TYPES } from '../reports/ReportFilters';

interface SendReportBuilderProps {
  config: SendReportConfig;
  onConfigChange: (config: SendReportConfig) => void;
  categories: Category[];
}

export const SendReportBuilder = ({ config, onConfigChange, categories }: SendReportBuilderProps) => {
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const [toPopoverOpen, setToPopoverOpen] = useState(false);

  const updateConfig = (updates: Partial<SendReportConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const toggleAccount = (accountValue: string) => {
    const newAccounts = config.selectedAccounts.includes(accountValue)
      ? config.selectedAccounts.filter(a => a !== accountValue)
      : [...config.selectedAccounts, accountValue];
    updateConfig({ selectedAccounts: newAccounts });
  };

  const selectAllAccounts = () => {
    updateConfig({ selectedAccounts: ACCOUNT_TYPES.map(a => a.value) });
  };

  const clearAllAccounts = () => {
    updateConfig({ selectedAccounts: [] });
  };

  const toggleCategory = (categoryName: string) => {
    const newCategories = config.selectedCategories.includes(categoryName)
      ? config.selectedCategories.filter(c => c !== categoryName)
      : [...config.selectedCategories, categoryName];
    updateConfig({ selectedCategories: newCategories });
  };

  const selectAllCategories = () => {
    updateConfig({ selectedCategories: categories.map(c => c.name) });
  };

  const clearAllCategories = () => {
    updateConfig({ selectedCategories: [] });
  };

  const entryCategories = categories.filter(c => c.type === 'entrada');
  const exitCategories = categories.filter(c => c.type === 'saida');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Básicas
          </CardTitle>
          <CardDescription>
            Configure o título e tipo do relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportTitle">Título do Relatório</Label>
            <Input
              id="reportTitle"
              value={config.reportTitle}
              onChange={(e) => updateConfig({ reportTitle: e.target.value })}
              placeholder="Digite o título do relatório"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Tipos de Transação</Label>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeEntries"
                  checked={config.includeEntries}
                  onCheckedChange={(checked) => updateConfig({ includeEntries: !!checked })}
                />
                <Label htmlFor="includeEntries" className="text-green-600 font-medium">
                  Incluir Entradas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeExits"
                  checked={config.includeExits}
                  onCheckedChange={(checked) => updateConfig({ includeExits: !!checked })}
                />
                <Label htmlFor="includeExits" className="text-red-600 font-medium">
                  Incluir Saídas
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Detalhamento das Transações</Label>
            <RadioGroup
              value={config.detailGrouping ?? 'date'}
              onValueChange={(val) =>
                updateConfig({ detailGrouping: val as 'date' | 'category' })
              }
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="send-group-date" value="date" />
                <Label htmlFor="send-group-date">Ordenar por Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="send-group-category" value="category" />
                <Label htmlFor="send-group-category">Agrupar por Categoria</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Define como o "DETALHAMENTO DAS TRANSAÇÕES" será organizado no PDF.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Seleção de Contas
          </CardTitle>
          <CardDescription>
            Escolha as contas para incluir no relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {config.selectedAccounts.length > 0 ? (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-orange-900">
                    {config.selectedAccounts.length} conta(s) selecionada(s) - Filtrando dados
                  </p>
                  <p className="text-xs text-orange-700">
                    Apenas transações destas contas serão incluídas
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Todas as contas incluídas
                  </p>
                  <p className="text-xs text-blue-700">
                    Nenhum filtro de conta aplicado
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllAccounts}
                className="flex-1"
              >
                Selecionar Todas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllAccounts}
                className="flex-1"
              >
                Limpar Seleção
              </Button>
            </div>
          </div>

          <Separator />

          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-3">
              {ACCOUNT_TYPES.map((account) => (
                <div key={account.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`account-${account.value}`}
                    checked={config.selectedAccounts.includes(account.value)}
                    onCheckedChange={() => toggleAccount(account.value)}
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`account-${account.value}`} 
                      className="font-medium cursor-pointer"
                    >
                      {account.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{account.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Período do Relatório
          </CardTitle>
          <CardDescription>
            Defina o período das transações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover open={fromPopoverOpen} onOpenChange={setFromPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !config.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateFrom ? format(config.dateFrom, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateFrom}
                    onSelect={(date) => {
                      updateConfig({ dateFrom: date });
                      setFromPopoverOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover open={toPopoverOpen} onOpenChange={setToPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !config.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateTo ? format(config.dateTo, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.dateTo}
                    onSelect={(date) => {
                      updateConfig({ dateTo: date });
                      setToPopoverOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {(config.dateFrom || config.dateTo) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Período: {config.dateFrom && config.dateTo 
                  ? `${format(config.dateFrom, 'dd/MM/yyyy')} até ${format(config.dateTo, 'dd/MM/yyyy')}`
                  : config.dateFrom 
                  ? `A partir de ${format(config.dateFrom, 'dd/MM/yyyy')}`
                  : `Até ${format(config.dateTo!, 'dd/MM/yyyy')}`
                }
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateConfig({ dateFrom: undefined, dateTo: undefined })}
              >
                Limpar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Selection */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtro por Categorias
          </CardTitle>
          <CardDescription>
            Selecione categorias específicas (deixe vazio para incluir todas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {config.selectedCategories.length > 0 ? (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-orange-900">
                    {config.selectedCategories.length} categoria(s) selecionada(s)
                  </p>
                  <p className="text-xs text-orange-700">
                    Apenas transações destas categorias serão incluídas
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Todas as categorias incluídas
                  </p>
                  <p className="text-xs text-blue-700">
                    Nenhum filtro de categoria aplicado
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllCategories}
                className="flex-1"
              >
                Selecionar Todas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllCategories}
                className="flex-1"
              >
                Limpar Seleção
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entryCategories.length > 0 && (
              <div>
                <Label className="text-green-600 font-medium mb-2 block">
                  Categorias de Entrada
                </Label>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-2">
                    {entryCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`entry-${category.id}`}
                          checked={config.selectedCategories.includes(category.name)}
                          onCheckedChange={() => toggleCategory(category.name)}
                        />
                        <Label htmlFor={`entry-${category.id}`} className="cursor-pointer">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {exitCategories.length > 0 && (
              <div>
                <Label className="text-red-600 font-medium mb-2 block">
                  Categorias de Saída
                </Label>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-2">
                    {exitCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`exit-${category.id}`}
                          checked={config.selectedCategories.includes(category.name)}
                          onCheckedChange={() => toggleCategory(category.name)}
                        />
                        <Label htmlFor={`exit-${category.id}`} className="cursor-pointer">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
