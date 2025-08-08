
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon,
  Settings,
  Building2,
  Filter,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CustomReportConfig } from './CustomReports';
import { Category } from '@/hooks/useCategories';
import { ACCOUNT_TYPES } from '../reports/ReportFilters';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ReportBuilderProps {
  config: CustomReportConfig;
  onConfigChange: (config: CustomReportConfig) => void;
  categories: Category[];
}

export const ReportBuilder = ({ config, onConfigChange, categories }: ReportBuilderProps) => {
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const [toPopoverOpen, setToPopoverOpen] = useState(false);

  const updateConfig = (updates: Partial<CustomReportConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const toggleAccount = (accountValue: string) => {
    const newAccounts = config.selectedAccounts.includes(accountValue)
      ? config.selectedAccounts.filter(a => a !== accountValue)
      : [...config.selectedAccounts, accountValue];
    updateConfig({ selectedAccounts: newAccounts });
  };

  const toggleCategory = (categoryName: string) => {
    const newCategories = config.selectedCategories.includes(categoryName)
      ? config.selectedCategories.filter(c => c !== categoryName)
      : [...config.selectedCategories, categoryName];
    updateConfig({ selectedCategories: newCategories });
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
                <RadioGroupItem id="group-date" value="date" />
                <Label htmlFor="group-date">Ordenar por Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="group-category" value="category" />
                <Label htmlFor="group-category">Agrupar por Categoria</Label>
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
        <CardContent>
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
            Defina o período das transações para análise
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros por Categoria
          </CardTitle>
          <CardDescription>
            Selecione categorias específicas (deixe vazio para incluir todas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Entry Categories */}
            {entryCategories.length > 0 && (
              <div>
                <Label className="text-green-600 font-medium mb-2 block">Categorias de Entrada</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
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
              </div>
            )}

            {/* Exit Categories */}
            {exitCategories.length > 0 && (
              <div>
                <Label className="text-red-600 font-medium mb-2 block">Categorias de Saída</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
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
              </div>
            )}

            {config.selectedCategories.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {config.selectedCategories.length} categoria(s) selecionada(s)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateConfig({ selectedCategories: [] })}
                  >
                    Limpar Seleção
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
