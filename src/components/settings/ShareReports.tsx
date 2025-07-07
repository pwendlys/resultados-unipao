
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Copy, 
  Eye,
  ExternalLink
} from 'lucide-react';

const ShareReports = () => {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [linkCreatedAt, setLinkCreatedAt] = useState<string | null>(null);
  
  const { toast } = useToast();

  const generateShareLink = () => {
    const timestamp = Date.now();
    const newLink = `${window.location.origin}/relatorios-compartilhados/${timestamp}`;
    
    setShareLink(newLink);
    setLinkCreatedAt(new Date().toLocaleDateString('pt-BR'));
    setViewCount(0);
    
    toast({
      title: "Link de compartilhamento criado!",
      description: "Os cooperados poderão visualizar os relatórios através deste link.",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Compartilhar Relatórios Unipão
        </CardTitle>
        <CardDescription>
          Gere um link exclusivo para que os cooperados possam visualizar os relatórios operacionais da Unipão. Eles terão acesso apenas para leitura.
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
            <h4 className="font-medium text-sm text-muted-foreground">Link Ativo</h4>
            
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium">Relatórios Operacionais Unipão</h5>
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
                  Visualizar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Gere um link exclusivo para compartilhar com os cooperados</li>
            <li>• Os cooperados terão acesso apenas aos relatórios operacionais</li>
            <li>• Visualização somente leitura - não podem editar ou modificar dados</li>
            <li>• O link é seguro e você pode acompanhar quantas visualizações teve</li>
            <li>• Você pode gerar um novo link a qualquer momento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareReports;
