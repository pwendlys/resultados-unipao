import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface FiscalObservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (observation: string) => void;
  transaction: {
    date: string;
    description: string;
    amount: number;
  } | null;
}

const FiscalObservationModal = ({
  open,
  onOpenChange,
  onSubmit,
  transaction
}: FiscalObservationModalProps) => {
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!observation.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(observation.trim());
      setObservation('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setObservation('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Marcar como Divergente
          </DialogTitle>
          <DialogDescription>
            Adicione uma observação explicando a divergência encontrada.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex justify-between items-start mb-1">
              <span className="text-muted-foreground">{transaction.date}</span>
              <span className="font-medium">{formatCurrency(transaction.amount)}</span>
            </div>
            <p className="line-clamp-2">{transaction.description}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="observation">Observação *</Label>
          <Textarea
            id="observation"
            placeholder="Ex: Juros não identificado, valor diferente do esperado, descrição incompleta..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!observation.trim() || isSubmitting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar Divergência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiscalObservationModal;
