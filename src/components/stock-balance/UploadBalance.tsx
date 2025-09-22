import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ColumnMapping from './ColumnMapping';
import { 
  parseStockBalanceFile, 
  detectColumns, 
  processStockBalanceData,
  validateFile,
  type ColumnMapping as ColumnMappingType 
} from '@/utils/stockBalanceProcessor';
import { useStockBalanceActions } from '@/hooks/useStockBalanceActions';

interface UploadBalanceProps {
  onSuccess: () => void;
}

const UploadBalance = ({ onSuccess }: UploadBalanceProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [detectedMapping, setDetectedMapping] = useState<ColumnMappingType>({});
  const [finalMapping, setFinalMapping] = useState<ColumnMappingType>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'processing'>('upload');
  
  const { toast } = useToast();
  const { createBalanco, createItens, saveMapeamento } = useStockBalanceActions();

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setUploadProgress(20);

    try {
      const { headers: fileHeaders, data } = await parseStockBalanceFile(selectedFile);
      setHeaders(fileHeaders);
      setRawData(data);
      setUploadProgress(60);
      
      const mapping = detectColumns(fileHeaders);
      setDetectedMapping(mapping);
      setFinalMapping(mapping);
      setUploadProgress(100);
      
      setStep('mapping');
    } catch (err) {
      setError('Falha ao processar o arquivo. Tente novamente.');
      console.error('File processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleMappingComplete = useCallback(async (mapping: ColumnMappingType, periodo: string) => {
    if (!file || !rawData.length) return;

    setStep('processing');
    setIsProcessing(true);

    try {
      // Process the data
      const processed = processStockBalanceData(rawData, headers, mapping);
      
      // Save column mapping for future use
      await saveMapeamento.mutateAsync(mapping);
      
      // Create balance record
      const balanco = await createBalanco.mutateAsync({
        nome: file.name,
        periodo,
        total_itens: processed.summary.total_itens,
        itens_negativos: processed.summary.itens_negativos,
        itens_positivos: processed.summary.itens_positivos,
        itens_neutros: processed.summary.itens_neutros,
        resultado_monetario: processed.summary.resultado_monetario,
        status: 'processado'
      });
      
      // Create items
      if (processed.items.length > 0) {
        await createItens.mutateAsync({
          balancoId: balanco.id,
          items: processed.items
        });
      }
      
      toast({
        title: "Sucesso!",
        description: `Balanço processado com ${processed.items.length} itens.`
      });
      
      // Reset form
      setFile(null);
      setHeaders([]);
      setRawData([]);
      setDetectedMapping({});
      setFinalMapping({});
      setStep('upload');
      
      onSuccess();
    } catch (err) {
      console.error('Processing error:', err);
      toast({
        title: "Erro",
        description: "Erro ao processar balanço. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, rawData, headers, createBalanco, createItens, saveMapeamento, toast, onSuccess]);

  if (step === 'mapping') {
    return (
      <ColumnMapping
        headers={headers}
        detectedMapping={detectedMapping}
        onComplete={handleMappingComplete}
        onBack={() => setStep('upload')}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Upload Balanço de Estoque</h2>
        <p className="text-muted-foreground">
          Envie sua planilha (.xlsx ou .csv) com o balanço de estoque para iniciar a análise.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Selecionar Arquivo
          </CardTitle>
          <CardDescription>
            Arraste e solte seu arquivo aqui ou clique para selecionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Arraste e solte seu arquivo aqui
              </p>
              <p className="text-xs text-muted-foreground">
                ou clique para selecionar
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" disabled={isProcessing} asChild>
                  <span>Escolher Arquivo</span>
                </Button>
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Formatos aceitos: .xlsx, .xls, .csv (máx. 20MB)
            </p>
          </div>

          {isProcessing && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {file && !isProcessing && step === 'upload' && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">Arquivo selecionado:</p>
              <p className="text-sm text-muted-foreground">{file.name}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadBalance;