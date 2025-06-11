import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExtratos, useExtratosActions, useTransactionsActions } from '@/hooks/useSupabaseData';
import { parseCSV, generateSampleCSV } from '@/utils/csvProcessor';

interface UploadExtratoProps {
  onNavigateToPage?: (page: string) => void;
}

const UploadExtrato = ({ onNavigateToPage }: UploadExtratoProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [period, setPeriod] = useState('');
  const [bank, setBank] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const { data: extratos = [], isLoading } = useExtratos();
  const { createExtrato, updateExtrato } = useExtratosActions();
  const { createTransactions } = useTransactionsActions();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(file => 
        file.type === 'application/pdf' || 
        file.type === 'text/csv' || 
        file.name.endsWith('.csv')
      );
      setFiles(prev => [...prev, ...validFiles]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(file => 
        file.type === 'application/pdf' || 
        file.type === 'text/csv' || 
        file.name.endsWith('.csv')
      );
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processCSVFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const transactions = parseCSV(csvContent);
          resolve(transactions.map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: '',
            status: 'pendente',
            suggested: false
          })));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'));
      reader.readAsText(file);
    });
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) return;
    if (!period || !bank) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o período e o banco.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      let hasProcessedTransactions = false;

      for (const file of files) {
        // Criar registro do extrato
        const extratoData = {
          name: file.name,
          size: formatFileSize(file.size),
          period,
          bank,
          file_type: file.name.endsWith('.csv') ? 'csv' : 'pdf',
          status: 'processando',
          transactions_count: 0,
          notes: notes || undefined
        };

        const extrato = await createExtrato.mutateAsync(extratoData);

        // Processar transações se for CSV
        if (file.name.endsWith('.csv') || file.type === 'text/csv') {
          try {
            console.log('Processing CSV file:', file.name);
            const transactions = await processCSVFile(file);
            const transactionsWithExtrato = transactions.map(t => ({
              ...t,
              extrato_id: extrato.id
            }));

            console.log('Creating transactions in database:', transactionsWithExtrato.length);
            // Aguardar a criação das transações
            await createTransactions.mutateAsync(transactionsWithExtrato);
            console.log('Transactions created successfully');

            // Atualizar status do extrato
            await updateExtrato.mutateAsync({
              id: extrato.id,
              status: 'processado',
              transactions_count: transactions.length
            });

            hasProcessedTransactions = true;

            toast({
              title: "Sucesso",
              description: `Arquivo ${file.name} processado com ${transactions.length} transações.`,
            });
          } catch (error) {
            console.error('Error processing CSV:', error);
            await updateExtrato.mutateAsync({
              id: extrato.id,
              status: 'erro'
            });
            
            toast({
              title: "Erro",
              description: `Erro ao processar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              variant: "destructive",
            });
          }
        } else {
          // Para PDFs, simular processamento (implementar OCR futuramente)
          setTimeout(async () => {
            await updateExtrato.mutateAsync({
              id: extrato.id,
              status: 'processado',
              transactions_count: Math.floor(Math.random() * 100) + 50
            });
          }, 2000);

          toast({
            title: "Sucesso",
            description: `Arquivo ${file.name} enviado para processamento.`,
          });
        }
      }

      // Limpar formulário
      setFiles([]);
      setPeriod('');
      setBank('');
      setNotes('');

      // Navegar para categorização se houver transações processadas
      if (hasProcessedTransactions && onNavigateToPage) {
        console.log('Navigating to categorization with processed transactions');
        // Aguardar um pouco mais para garantir que as queries foram atualizadas
        setTimeout(() => {
          onNavigateToPage('categorization');
          toast({
            title: "Redirecionando",
            description: "Direcionando para a categorização das transações importadas.",
          });
        }, 2000); // Aumentado para 2 segundos
      }
      
    } catch (error) {
      console.error('Error in handleProcessFiles:', error);
      toast({
        title: "Erro",
        description: `Erro ao processar arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'exemplo_extrato.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processado':
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'processando':
        return <AlertCircle className="h-5 w-5 text-secondary animate-pulse" />;
      case 'erro':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processado':
        return <Badge className="bg-primary">Processado</Badge>;
      case 'processando':
        return <Badge variant="outline" className="border-secondary text-secondary">Processando</Badge>;
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Upload de Extratos</h1>
        <p className="text-muted-foreground">
          Faça upload dos extratos bancários em PDF ou CSV para processamento automático
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Extrato</CardTitle>
          <CardDescription>
            Selecione ou arraste arquivos PDF ou CSV de extratos bancários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sample CSV Download */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Exemplo CSV
            </Button>
          </div>

          {/* Drag and Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              Arraste seus arquivos PDF ou CSV aqui
            </h3>
            <p className="text-muted-foreground mb-4">
              ou clique para selecionar arquivos
            </p>
            <Label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer">
                Selecionar Arquivos
              </Button>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </Label>
            <p className="text-xs text-muted-foreground mt-2">
              Arquivos PDF e CSV são aceitos
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Arquivos Selecionados:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.name.endsWith('.csv') ? 'CSV' : 'PDF'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Período do Extrato *</Label>
              <Input
                id="period"
                placeholder="Ex: Março 2024"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">Banco *</Label>
              <Input
                id="bank"
                placeholder="Ex: Banco do Brasil"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre este extrato..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={files.length === 0 || isProcessing || !period || !bank}
            onClick={handleProcessFiles}
          >
            {isProcessing ? 'Processando...' : `Processar Extrato${files.length > 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Files History */}
      <Card>
        <CardHeader>
          <CardTitle>Extratos Processados</CardTitle>
          <CardDescription>
            Histórico de extratos enviados e processados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando extratos...
            </div>
          ) : extratos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum extrato processado ainda
            </div>
          ) : (
            <div className="space-y-4">
              {extratos.map((extrato) => (
                <div key={extrato.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(extrato.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium">{extrato.name}</p>
                        {getStatusBadge(extrato.status)}
                        <Badge variant="outline" className="text-xs">
                          {extrato.file_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {extrato.period}
                        </span>
                        <span>{extrato.bank}</span>
                        <span>{extrato.size}</span>
                        {extrato.transactions_count > 0 && (
                          <span>{extrato.transactions_count} transações</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {extrato.status === 'processado' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onNavigateToPage && onNavigateToPage('categorization')}
                      >
                        Categorizar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadExtrato;
