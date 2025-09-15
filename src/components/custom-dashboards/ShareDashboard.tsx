import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, ExternalLink } from 'lucide-react';
import { useSharedDashboardsActions } from '@/hooks/useSharedDashboards';
import { useCustomEntries } from '@/hooks/useCustomEntries';
import { DashboardPersonalizado } from '@/hooks/useCustomDashboards';

interface ShareDashboardProps {
  dashboard: DashboardPersonalizado;
}

const ShareDashboard = ({ dashboard }: ShareDashboardProps) => {
  const [shareLink, setShareLink] = useState<string>('');
  const [linkCreatedAt, setLinkCreatedAt] = useState<string>('');
  const [viewCount, setViewCount] = useState<number>(0);
  const { toast } = useToast();
  const { createSharedDashboard } = useSharedDashboardsActions();
  const { data: entries = [] } = useCustomEntries(dashboard.id);

  const generateShareLink = async () => {
    try {
      const shareId = `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/dashboard-compartilhado/${shareId}`;

      // Prepare dashboard data for sharing
      const dashboardConfig = {
        nome: dashboard.nome,
        created_at: dashboard.created_at,
        entriesCount: entries.length
      };

      const dashboardData = {
        entries: entries,
        summary: {
          totalEntradas: entries.filter(e => e.tipo === 'entrada').reduce((sum, e) => sum + Number(e.valor), 0),
          totalSaidas: entries.filter(e => e.tipo === 'saida').reduce((sum, e) => sum + Number(e.valor), 0),
          saldo: entries.reduce((sum, e) => {
            return sum + (e.tipo === 'entrada' ? Number(e.valor) : -Number(e.valor));
          }, 0)
        }
      };

      await createSharedDashboard.mutateAsync({
        title: `Dashboard: ${dashboard.nome}`,
        config: dashboardConfig,
        data: dashboardData,
        share_id: shareId,
        dashboard_id: dashboard.id
      });

      setShareLink(url);
      setLinkCreatedAt(new Date().toLocaleString('pt-BR'));
      setViewCount(0);

      toast({
        title: "Link gerado com sucesso!",
        description: "O link de compartilhamento foi criado e está pronto para uso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível criar o link de compartilhamento.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const openShareLink = (url: string) => {
    window.open(url, '_blank');
    setViewCount(prev => prev + 1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Compartilhar Dashboard: {dashboard.nome}
        </CardTitle>
        <CardDescription>
          Gere um link para compartilhar este dashboard com acesso somente leitura.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shareLink ? (
          <Button 
            onClick={generateShareLink} 
            className="w-full"
            disabled={createSharedDashboard.isPending}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {createSharedDashboard.isPending ? 'Gerando...' : 'Gerar Link de Compartilhamento'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Link de Compartilhamento:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-background rounded border text-sm break-all">
                  {shareLink}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(shareLink)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Criado em: {linkCreatedAt}</span>
              <span>Visualizações: {viewCount}</span>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(shareLink)}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openShareLink(shareLink)}
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Testar Acesso
              </Button>
            </div>

            <Button 
              onClick={generateShareLink} 
              variant="secondary"
              className="w-full"
              disabled={createSharedDashboard.isPending}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Gerar Novo Link
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
          <h4 className="font-medium text-blue-900 mb-2">Como funciona o acesso compartilhado:</h4>
          <ul className="text-blue-800 space-y-1">
            <li>• O link permite visualização somente leitura do dashboard</li>
            <li>• Não é necessário login para acessar</li>
            <li>• Os dados ficam disponíveis mesmo se o dashboard original for modificado</li>
            <li>• Ideal para compartilhar com cooperados ou stakeholders</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareDashboard;