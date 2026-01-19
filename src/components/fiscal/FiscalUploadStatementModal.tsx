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
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';

interface FiscalUploadStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
}

const FiscalUploadStatementModal = ({
  open,
  onOpenChange,
  reportId,
  reportTitle,
}: FiscalUploadStatementModalProps) => {
  const { toast } = useToast();
  const uploadFile = useUploadStatementFile();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      await uploadFile.mutateAsync({
        reportId,
        file: selectedFile,
        userId: user.id,
      });

      toast({
        title: 'PDF anexado',
        description: 'O extrato foi vinculado ao relatório com sucesso.',
      });

      setSelectedFile(null);
      onOpenChange(false);
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
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
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

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <FileText className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              O PDF será disponibilizado para os fiscais consultarem durante a revisão.
              A ordenação das transações já segue a ordem do extrato importado.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadFile.isPending}
          >
            {uploadFile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
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
