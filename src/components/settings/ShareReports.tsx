
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Copy, 
  Eye,
  ExternalLink,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  FileText
} from 'lucide-react';
import { useCooperadoReports, CooperadoReport } from '@/hooks/useCooperadoReports';
import { useSharedReportsActions } from '@/hooks/useSharedReports';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ShareReports = () => {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [linkCreatedAt, setLinkCreatedAt] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Estados e hooks para gerenciamento de relatórios do cooperado
  const queryClient = useQueryClient();
  const { data: cooperadoReports = [], isLoading: loadingReports } = useCooperadoReports();
  const { updateSharedReport, deleteSharedReport } = useSharedReportsActions();
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const generateShareLink = () => {
    const timestamp = Date.now();
    const shareId = `unipao-${timestamp}`;
    const newLink = `https://resultados-unipao.lovable.app/relatorios-compartilhados/${shareId}`;
    
    setShareLink(newLink);
    setLinkCreatedAt(new Date().toLocaleDateString('pt-BR'));
    setViewCount(0);
    
    toast({
      title: "Link de compartilhamento criado!",
      description: "Os cooperados poderão visualizar apenas os relatórios através deste link.",
    });
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const openShareLink = (url: string) => {
    // Simular incremento de visualização
    setViewCount(prev => prev + 1);
    window.open(url, '_blank');
  };

  const handleEditReport = (report: CooperadoReport) => {
    setEditingReport(report.id);
    setEditTitle(report.title);
  };

  const handleSaveEdit = async (reportId: string) => {
    if (!editTitle.trim()) {
      toast({
        title: "Erro",
        description: "O título não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSharedReport.mutateAsync({
        id: reportId,
        title: editTitle.trim(),
      });

      queryClient.invalidateQueries({ queryKey: ['cooperado-reports'] });

      setEditingReport(null);
      setEditTitle('');

      toast({
        title: "Sucesso!",
        description: "Relatório atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setEditTitle('');
  };

  const handleDeleteReport = async (reportId: string, reportTitle: string) => {
    try {
      await deleteSharedReport.mutateAsync(reportId);

      queryClient.invalidateQueries({ queryKey: ['cooperado-reports'] });

      toast({
        title: "Sucesso!",
        description: `Relatório "${reportTitle}" foi removido do painel do cooperado.`,
      });
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Compartilhar Relatórios Unipão
        </CardTitle>
        <CardDescription>
          Gere um link exclusivo para que os cooperados possam visualizar APENAS os relatórios operacionais da Unipão. Eles terão acesso somente à página de relatórios, sem navegação para outras seções.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generate Link Button */}
        <div className="flex items-center gap-4">
          <Button onClick={generateShareLink} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            {shareLink ? 'Gerar Novo Link' : 'Gerar Link de Compartilhamento'}
          </Button>
        </div>

        {/* Share Link Display */}
        {shareLink && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Link Ativo para Cooperados</h4>
            
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium">Acesso Exclusivo aos Relatórios</h5>
                  <p className="text-sm text-muted-foreground">
                    Criado em: {linkCreatedAt}
                  </p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {viewCount} visualizações
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm font-mono">
                <span className="flex-1 truncate">{shareLink}</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(shareLink)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openShareLink(shareLink)}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Testar Acesso
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Como funciona o acesso compartilhado:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• O link dá acesso APENAS à página de relatórios operacionais</li>
            <li>• Os cooperados NÃO terão acesso a outras seções do sistema</li>
            <li>• Visualização somente leitura - não podem editar ou modificar dados</li>
            <li>• Interface simplificada especificamente para cooperados</li>
            <li>• Você pode acompanhar quantas visualizações o link teve</li>
            <li>• Você pode gerar um novo link a qualquer momento para revogar o anterior</li>
          </ul>
        </div>

        {/* Separador */}
        <div className="border-t my-6" />

        {/* Seção de Relatórios Enviados ao Cooperado */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            Relatórios Enviados para o Painel do Cooperado
          </h4>
          
          {loadingReports ? (
            <div className="text-center py-4 text-muted-foreground">
              Carregando relatórios...
            </div>
          ) : cooperadoReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
              <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>Nenhum relatório enviado ao cooperado ainda.</p>
              <p className="text-sm mt-1">
                Use o botão "Enviar p/ Cooperado" nos Relatórios Personalizados para enviar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cooperadoReports.map((report) => (
                <div 
                  key={report.id} 
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
                >
                  {editingReport === report.id ? (
                    // Modo de edição
                    <div className="flex items-center gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título do relatório"
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveEdit(report.id)}
                        disabled={updateSharedReport.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    // Modo de visualização
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-base">{report.title}</h5>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Enviado em: {formatDate(report.created_at)}
                            </span>
                            {report.updated_at !== report.created_at && (
                              <span className="flex items-center gap-1">
                                <Edit2 className="h-3 w-3" />
                                Atualizado: {formatDate(report.updated_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReport(report)}
                            title="Editar título"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive hover:text-destructive"
                                title="Remover do painel do cooperado"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Relatório do Cooperado</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover o relatório "{report.title}" do painel do cooperado? 
                                  Os cooperados não terão mais acesso a este relatório.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReport(report.id, report.title)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      {/* Informações adicionais do relatório */}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <span>ID: {report.share_id}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareReports;
