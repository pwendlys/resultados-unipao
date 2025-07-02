
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Copy, 
  Eye, 
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ShareReports = () => {
  const [shareLinks, setShareLinks] = useState([
    {
      id: '1',
      name: 'Relatório Mensal - Dezembro 2024',
      url: `${window.location.origin}/share/relatorio/dezembro-2024`,
      createdAt: '2024-12-01',
      views: 12
    },
    {
      id: '2',
      name: 'Relatório Anual - 2024',
      url: `${window.location.origin}/share/relatorio/anual-2024`,
      createdAt: '2024-12-15',
      views: 5
    }
  ]);
  
  const { toast } = useToast();

  const generateShareLink = () => {
    const newLink = {
      id: Date.now().toString(),
      name: `Relatório Operacional - ${new Date().toLocaleDateString('pt-BR')}`,
      url: `${window.location.origin}/share/relatorio/${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      views: 0
    };
    
    setShareLinks([...shareLinks, newLink]);
    
    toast({
      title: "Link de compartilhamento criado!",
      description: "O link foi gerado com sucesso. Os cooperados poderão visualizar o relatório.",
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
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Compartilhar Relatórios
        </CardTitle>
        <CardDescription>
          Gere links para compartilhar relatórios com os cooperados. Eles poderão apenas visualizar, sem poder editar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generate New Link */}
        <div className="flex items-center gap-4">
          <Button onClick={generateShareLink} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Gerar Novo Link de Compartilhamento
          </Button>
        </div>

        {/* Share Links List */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Links Ativos</h4>
          
          {shareLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum link de compartilhamento criado ainda
            </div>
          ) : (
            <div className="space-y-3">
              {shareLinks.map((link) => (
                <div key={link.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium">{link.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        Criado em: {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {link.views} visualizações
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm font-mono">
                    <span className="flex-1 truncate">{link.url}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(link.url)}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openShareLink(link.url)}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Como funciona o compartilhamento:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Os cooperados podem visualizar os relatórios através dos links gerados</li>
            <li>• Não é possível editar ou modificar os dados</li>
            <li>• Os links são seguros e rastreáveis</li>
            <li>• Você pode ver quantas vezes cada link foi acessado</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareReports;
