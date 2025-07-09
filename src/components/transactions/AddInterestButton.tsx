
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calculator } from 'lucide-react';
import { useTransactionsActions } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

interface AddInterestButtonProps {
  transactionId: string;
  currentInterest: number;
  onInterestAdded: () => void;
}

const AddInterestButton = ({ transactionId, currentInterest, onInterestAdded }: AddInterestButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [interestValue, setInterestValue] = useState(currentInterest?.toString() || '0');
  const [isLoading, setIsLoading] = useState(false);
  const { updateTransaction } = useTransactionsActions();
  const { toast } = useToast();

  const handleAddInterest = async () => {
    if (!interestValue || isNaN(Number(interestValue))) {
      toast({
        title: "Valor Inválido",
        description: "Por favor, insira um valor numérico válido para os juros.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateTransaction.mutateAsync({
        id: transactionId,
        juros: Number(interestValue),
      });

      toast({
        title: "Juros Adicionados",
        description: `Juros de R$ ${Number(interestValue).toFixed(2)} foram adicionados à transação.`,
      });

      setIsOpen(false);
      onInterestAdded();
    } catch (error) {
      console.error('Erro ao adicionar juros:', error);
      toast({
        title: "Erro ao Adicionar Juros",
        description: "Ocorreu um erro ao adicionar os juros. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={currentInterest > 0 ? "default" : "outline"}
          className="h-8 px-2"
        >
          <Calculator className="h-3 w-3 mr-1" />
          {currentInterest > 0 ? `R$ ${currentInterest.toFixed(2)}` : 'Juros'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Juros à Transação</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="interest" className="text-right">
              Valor dos Juros
            </Label>
            <Input
              id="interest"
              type="number"
              step="0.01"
              min="0"
              value={interestValue}
              onChange={(e) => setInterestValue(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddInterest}
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Juros'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddInterestButton;
