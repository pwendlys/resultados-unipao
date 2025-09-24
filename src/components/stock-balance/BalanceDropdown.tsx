import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BalancoEstoque } from '@/hooks/useStockBalance';
import { formatCurrency } from '@/utils/financialProcessor';
import { cn } from '@/lib/utils';

interface BalanceDropdownProps {
  balances: BalancoEstoque[];
  selectedBalance: BalancoEstoque;
  onSelect: (balance: BalancoEstoque) => void;
}

const BalanceDropdown = ({ balances, selectedBalance, onSelect }: BalanceDropdownProps) => {
  return (
    <div className="w-full max-w-md">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">{selectedBalance.nome}</span>
              <span className="text-xs text-muted-foreground">
                {selectedBalance.total_itens} itens • {formatCurrency(selectedBalance.resultado_monetario || 0)}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar balanço..." />
            <CommandList>
              <CommandEmpty>Nenhum balanço encontrado.</CommandEmpty>
              <CommandGroup>
                {balances.map((balance) => (
                  <CommandItem
                    key={balance.id}
                    value={balance.nome}
                    onSelect={() => onSelect(balance)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedBalance.id === balance.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{balance.nome}</span>
                        <span className={cn(
                          "text-sm font-medium",
                          (balance.resultado_monetario || 0) >= 0 
                            ? "text-green-600" 
                            : "text-red-600"
                        )}>
                          {formatCurrency(balance.resultado_monetario || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{balance.periodo}</span>
                        <span>•</span>
                        <span>{balance.total_itens} itens</span>
                        <span>•</span>
                        <span>{new Date(balance.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default BalanceDropdown;