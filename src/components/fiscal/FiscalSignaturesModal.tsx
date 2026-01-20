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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFiscalSignatures } from '@/hooks/useFiscalSignatures';
import { PenTool, X, User, Clock } from 'lucide-react';
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
  const pendingSlots = Math.max(0, 3 - signatureCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
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

          {/* Signatures Table */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fiscal</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Assinatura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Signed entries */}
                  {signatures.map((signature, index) => (
                    <TableRow key={signature.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {signature.display_name || `Fiscal ${index + 1}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(signature.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500">Assinado</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {signature.signature_data && (
                          <div className="bg-white border rounded p-1 inline-block">
                            <img
                              src={signature.signature_data}
                              alt={`Assinatura de ${signature.display_name || 'usuário'}`}
                              className="h-10 max-w-[100px] object-contain mx-auto"
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Pending slots */}
                  {Array.from({ length: pendingSlots }).map((_, i) => (
                    <TableRow key={`pending-${i}`} className="opacity-60">
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Aguardando fiscal...</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">Pendente</Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">—</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
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