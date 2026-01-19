import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFiscalSignatures } from '@/hooks/useFiscalSignatures';
import { PenTool, X, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FiscalSignaturesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
}

const FiscalSignaturesModal = ({
  open,
  onOpenChange,
  reportId,
  reportTitle,
}: FiscalSignaturesModalProps) => {
  // Only fetch when modal is open and we have a valid reportId
  const shouldFetch = open && reportId && reportId.trim() !== '';
  const { data: signatures = [], isLoading, error } = useFiscalSignatures(shouldFetch ? reportId : undefined);

  // Debug logging
  console.log('FiscalSignaturesModal - open:', open, 'reportId:', reportId, 'signatures:', signatures.length, 'error:', error);

  const signatureCount = signatures.length;
  const isComplete = signatureCount >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Assinaturas do Relatório
          </DialogTitle>
          <DialogDescription>
            {reportTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Counter */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Total de assinaturas</span>
            <Badge 
              variant={isComplete ? "default" : "secondary"}
              className={isComplete ? "bg-green-500" : ""}
            >
              {signatureCount}/3
            </Badge>
          </div>

          {/* Signatures List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : signatures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PenTool className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma assinatura registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {signatures.map((signature, index) => (
                <div
                  key={signature.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {signature.display_name || `Usuário ${index + 1}`}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(signature.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  {/* Signature Preview */}
                  {signature.signature_data && (
                    <div className="bg-white border rounded p-2">
                      <img
                        src={signature.signature_data}
                        alt={`Assinatura de ${signature.display_name || 'usuário'}`}
                        className="max-h-20 mx-auto"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiscalSignaturesModal;
