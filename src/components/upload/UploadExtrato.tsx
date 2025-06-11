
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const UploadExtrato = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      name: 'extrato_marco_2024.pdf',
      size: '2.4 MB',
      status: 'processado',
      period: 'Março 2024',
      bank: 'Banco do Brasil',
      transactions: 156
    },
    {
      id: 2,
      name: 'extrato_abril_2024.pdf', 
      size: '1.8 MB',
      status: 'processando',
      period: 'Abril 2024',
      bank: 'Caixa Econômica',
      transactions: null
    }
  ]);

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
      const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
      setFiles(prev => [...prev, ...pdfFiles]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
      setFiles(prev => [...prev, ...pdfFiles]);
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
          Faça upload dos extratos bancários em PDF para processamento automático
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Extrato</CardTitle>
          <CardDescription>
            Selecione ou arraste arquivos PDF de extratos bancários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              Arraste seus arquivos PDF aqui
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
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </Label>
            <p className="text-xs text-muted-foreground mt-2">
              Apenas arquivos PDF são aceitos
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Arquivos Selecionados:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
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
              <Label htmlFor="period">Período do Extrato</Label>
              <Input
                id="period"
                placeholder="Ex: Março 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">Banco</Label>
              <Input
                id="bank"
                placeholder="Ex: Banco do Brasil"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre este extrato..."
              rows={3}
            />
          </div>

          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={files.length === 0}
          >
            Processar Extrato{files.length > 1 ? 's' : ''}
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
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(file.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium">{file.name}</p>
                      {getStatusBadge(file.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {file.period}
                      </span>
                      <span>{file.bank}</span>
                      <span>{file.size}</span>
                      {file.transactions && (
                        <span>{file.transactions} transações</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {file.status === 'processado' && (
                    <Button variant="outline" size="sm">
                      Categorizar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadExtrato;
