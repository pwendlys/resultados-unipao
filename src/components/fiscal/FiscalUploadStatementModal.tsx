import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUploadStatementFile } from '@/hooks/useFiscalReportFiles';
import { useInvalidateTransactionOrder } from '@/hooks/useFiscalTransactionOrder';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X, Loader2, CheckCircle, ListOrdered } from 'lucide-react';

interface FiscalUploadStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
}

interface OrderingResult {
  matched: number;
  total: number;
  extracted_lines: number;
  message: string;
}

const FiscalUploadStatementModal = ({
  open,
  onOpenChange,
  reportId,
  reportTitle,
}: FiscalUploadStatementModalProps) => {
  const { toast } = useToast();
  const uploadFile = useUploadStatementFile();
  const invalidateOrder = useInvalidateTransactionOrder();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderingResult, setOrderingResult] = useState<OrderingResult | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setOrderingResult(null);
      } else {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo PDF.',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setOrderingResult(null);
      } else {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo PDF.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Step 1: Upload file
      const fileRecord = await uploadFile.mutateAsync({
        reportId,
        file: selectedFile,
        userId: user.id,
      });

      toast({
        title: 'PDF anexado',
        description: 'Processando ordenação das transações...',
      });

      // Step 2: Call edge function to parse PDF and generate order
      setIsProcessingOrder(true);
      
      try {
        const { data: orderData, error: orderError } = await supabase.functions.invoke(
          'parse-statement-pdf',
          {
            body: {
              report_id: reportId,
              file_path: fileRecord.file_path,
            },
          }
        );

        if (orderError) {
          console.error('Error calling parse-statement-pdf:', orderError);
          toast({
            title: 'PDF anexado',
            description: 'Arquivo salvo, mas não foi possível processar a ordenação automaticamente.',
            variant: 'default',
          });
        } else if (orderData) {
          setOrderingResult(orderData as OrderingResult);
          
          // Invalidate order query to refetch in panel
          invalidateOrder(reportId);
          
          toast({
            title: 'Ordenação aplicada',
            description: orderData.message || `${orderData.matched} de ${orderData.total} transações ordenadas.`,
          });
        }
      } catch (parseError) {
        console.error('Error parsing PDF:', parseError);
        // PDF is still attached, just ordering failed
        toast({
          title: 'PDF anexado',
          description: 'Arquivo salvo. A ordenação automática não pôde ser processada.',
          variant: 'default',
        });
      } finally {
        setIsProcessingOrder(false);
      }

      // Small delay to show result before closing
      setTimeout(() => {
        setSelectedFile(null);
        setOrderingResult(null);
        onOpenChange(false);
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível anexar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setOrderingResult(null);
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isUploading = uploadFile.isPending || isProcessingOrder;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anexar Extrato PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Relatório: <strong>{reportTitle}</strong>
          </p>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}
            `}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Arraste o PDF do extrato aqui ou
                </p>
                <label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">Selecionar arquivo</span>
                  </Button>
                </label>
              </>
            )}
          </div>

          {/* Ordering Result */}
          {orderingResult && (
            <div className="flex items-start gap-2 text-sm bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800">
              <ListOrdered className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  Ordenação aplicada
                </p>
                <p className="text-green-600 dark:text-green-500">
                  {orderingResult.matched} de {orderingResult.total} transações vinculadas ao PDF.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <FileText className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              O PDF será disponibilizado para os fiscais e usado para ordenar as transações na mesma sequência do extrato bancário.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {uploadFile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : isProcessingOrder ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando ordem...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Anexar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FiscalUploadStatementModal;