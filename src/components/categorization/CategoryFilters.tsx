
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format as dateFnsFormat } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface CategoryFiltersProps {
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchType: 'description' | 'value';
  setSearchType: (type: 'description' | 'value') => void;
  showOnlyUncategorized: boolean;
  setShowOnlyUncategorized: (show: boolean) => void;
}

const CategoryFilters = ({
  selectedAccount,
  setSelectedAccount,
  dateRange,
  setDateRange,
  searchTerm,
  setSearchTerm,
  searchType,
  setSearchType,
  showOnlyUncategorized,
  setShowOnlyUncategorized
}: CategoryFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Account Type Filter */}
        <div>
          <Label htmlFor="accountType">Tipo de Conta</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as Contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Contas</SelectItem>
              <SelectItem value="BOLETOS">Boletos</SelectItem>
              <SelectItem value="MENSALIDADES E TX ADM">Mensalidades e Taxas Adm</SelectItem>
              <SelectItem value="APORTE E JOIA">Aporte e Joia</SelectItem>
              <SelectItem value="Cora">Cora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div>
          <Label>Período</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange?.from || !dateRange.to ? "text-muted-foreground" : undefined
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to ? (
                  <>
                    {dateFnsFormat(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {dateFnsFormat(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  <span>Selecionar Período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Filter with Type Selector */}
        <div className="space-y-2">
          <Label htmlFor="search">Pesquisar Transação</Label>
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="description">Descrição</SelectItem>
                <SelectItem value="value">Valor</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="search"
              id="search"
              placeholder={
                searchType === 'description' 
                  ? 'Pesquisar por descrição...' 
                  : 'Pesquisar por valor (ex: 100.50)...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Show Only Uncategorized Filter */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="uncategorized-filter"
          checked={showOnlyUncategorized}
          onCheckedChange={(checked) => setShowOnlyUncategorized(checked as boolean)}
        />
        <Label htmlFor="uncategorized-filter" className="text-sm font-medium">
          Mostrar apenas transações não categorizadas
        </Label>
      </div>
    </div>
  );
};

export default CategoryFilters;
