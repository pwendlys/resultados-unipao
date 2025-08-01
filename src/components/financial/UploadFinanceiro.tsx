import React, { useState } from 'react';
import { Upload, FileText, File, Download, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDocumentosFinanceiros, useDocumentosFinanceirosActions, useItensFinanceirosActions } from '@/hooks/useFinancialData';
import { processCSVFinancial, processXLSXFinancial, processPDFFinancial, downloadFinancialSampleCSV, downloadFinancialSampleXLSX } from '@/utils/financialProcessor';
import { toast } from 'sonner';

interface UploadFinanceiroProps {
  onNavigateToPage?: (page: string) => void;
}

const TIPOS_DOCUMENTO = [
  { value: 'contas_a_receber', label: 'Contas a Receber' },
  { value: 'contas_a_pagar', label: 'Contas a Pagar' },
  { value: 'contas_vencidas', label: 'Contas Vencidas' },
];

const UploadFinanceiro: React.FC<UploadFinanceiroProps> = ({ onNavigateToPage }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [periodo, setPeriodo] = useState('');
  const [banco, setBanco] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: documentos, isLoading } = useDocumentosFinanceiros();
  const { createDocumento, deleteDocumento } = useDocumentosFinanceirosActions();
  const { createItens } = useItensFinanceirosActions();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => 
      file.type === 'text/csv' || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/pdf'
    );
    
    if (validFiles.length !== droppedFiles.length) {
      toast.error('Apenas arquivos CSV, XLSX e PDF são aceitos');
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: File): string => {
    if (file.type === 'text/csv') return 'CSV';
    if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'XLSX';
    if (file.type === 'application/pdf') return 'PDF';
    return 'Desconhecido';
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    if (!tipoDocumento) {
      toast.error('Selecione o tipo de documento');
      return;
    }

    if (!periodo) {
      toast.error('Informe o período');
      return;
    }

    setIsProcessing(true);

    try {
      for (const file of files) {
        let processedData;

        if (file.type === 'text/csv') {
          processedData = await processCSVFinancial(file, tipoDocumento, periodo, banco);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          processedData = await processXLSXFinancial(file, tipoDocumento, periodo, banco);
        } else if (file.type === 'application/pdf') {
          processedData = await processPDFFinancial(file, tipoDocumento, periodo, banco);
        } else {
          continue;
        }

        if (observacoes) {
          processedData.documento.observacoes = observacoes;
        }

        // Criar o documento
        const novoDocumento = await createDocumento.mutateAsync(processedData.documento);

        // Criar os itens se houver
        if (processedData.itens.length > 0) {
          const itensComDocumento = processedData.itens.map(item => ({
            ...item,
            documento_id: novoDocumento.id,
          }));
          
          await createItens.mutateAsync(itensComDocumento);
        }
      }

      toast.success('Arquivos processados com sucesso!');
      
      // Limpar formulário
      setFiles([]);
      setPeriodo('');
      setBanco('');
      setTipoDocumento('');
      setObservacoes('');

      // Navegar para relatórios financeiros
      if (onNavigateToPage) {
        onNavigateToPage('relatorios-financeiros');
      }
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      toast.error('Erro ao processar arquivos');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processado':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'erro':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processado':
        return <Badge variant="default" className="bg-success/10 text-success">Processado</Badge>;
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getTipoDocumentoBadge = (tipo: string) => {
    const tipoObj = TIPOS_DOCUMENTO.find(t => t.value === tipo);
    const colors = {
      'contas_a_receber': 'bg-success/10 text-success',
      'contas_a_pagar': 'bg-warning/10 text-warning', 
      'contas_vencidas': 'bg-destructive/10 text-destructive'
    };
    
    return (
      <Badge className={colors[tipo as keyof typeof colors] || 'bg-muted'}>
        {tipoObj?.label || tipo}
      </Badge>
    );
  };

  const handleDeleteDocumento = async (documentoId: string, documentoNome: string) => {
    try {
      await deleteDocumento.mutateAsync(documentoId);
      toast.success(`Documento "${documentoNome}" excluído com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      toast.error('Erro ao excluir documento');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Financeiro</h1>
          <p className="text-muted-foreground mt-2">
            Importe seus documentos financeiros (CSV, XLSX, PDF) para gestão de contas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Arraste e solte seus arquivos aqui
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar (CSV, XLSX, PDF)
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" type="button">
                  Selecionar Arquivos
                </Button>
              </Label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Arquivos Selecionados:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-muted-foreground">{formatFileSize(file.size)} • {getFileType(file)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Período *</Label>
                <Input
                  id="periodo"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  placeholder="Ex: Janeiro 2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banco">Banco/Instituição</Label>
              <Input
                id="banco"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                placeholder="Ex: Banco do Brasil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais sobre os documentos..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleProcessFiles} 
              disabled={isProcessing || files.length === 0}
              className="w-full"
            >
              {isProcessing ? 'Processando...' : 'Processar Documentos'}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFinancialSampleCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Modelo CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFinancialSampleXLSX}
              >
                <Download className="h-4 w-4 mr-2" />
                Modelo XLSX
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Histórico de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando histórico...</p>
            ) : documentos && documentos.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {documentos.map((documento) => (
                  <div key={documento.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(documento.status)}
                          <h4 className="font-medium text-foreground">{documento.nome}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getTipoDocumentoBadge(documento.tipo_documento)}
                          {getStatusBadge(documento.status)}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o documento "{documento.nome}"? 
                              Esta ação não pode ser desfeita e todos os itens financeiros relacionados serão removidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteDocumento(documento.id, documento.nome)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Período:</strong> {documento.periodo}</p>
                      {documento.banco && <p><strong>Banco:</strong> {documento.banco}</p>}
                      <p><strong>Valor Total:</strong> R$ {documento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p><strong>Quantidade:</strong> {documento.quantidade_documentos} itens</p>
                      <p><strong>Criado em:</strong> {new Date(documento.created_at).toLocaleDateString('pt-BR')}</p>
                      {documento.observacoes && (
                        <p><strong>Observações:</strong> {documento.observacoes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum documento financeiro processado ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadFinanceiro;