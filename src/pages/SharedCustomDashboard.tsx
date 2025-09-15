import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSharedDashboard } from '@/hooks/useSharedDashboards';
import ChartsView from '@/components/custom-dashboards/ChartsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, DollarSign } from 'lucide-react';

const SharedCustomDashboard = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [isValidLink, setIsValidLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: sharedDashboard, isLoading: isLoadingDashboard, error } = useSharedDashboard(shareId || '');

  useEffect(() => {
    if (shareId && shareId.length > 0) {
      if (!isLoadingDashboard) {
        if (sharedDashboard) {
          setIsValidLink(true);
        }
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [shareId, sharedDashboard, isLoadingDashboard]);

  if (isLoading || isLoadingDashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isValidLink || !sharedDashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            O link do dashboard compartilhado não é válido ou expirou.
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com a administração da Unipão para obter um novo link de acesso.
          </p>
        </div>
      </div>
    );
  }

  const { data: dashboardData, config: dashboardConfig } = sharedDashboard;
  const entries = dashboardData?.entries || [];
  const summary = dashboardData?.summary || { totalEntradas: 0, totalSaidas: 0, saldo: 0 };

  return (
    <div className="min-h-screen bg-background">
      {/* Header específico para visualização compartilhada */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Unipão</h1>
              <p className="text-sm text-muted-foreground">Dashboard Compartilhado - Somente Leitura</p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              Acesso Cooperado
            </div>
          </div>
        </div>
      </header>
      
      {/* Conteúdo do dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{dashboardConfig?.nome || sharedDashboard.title}</h2>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {summary.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {summary.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                <BarChart3 className={`h-4 w-4 ${summary.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {summary.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        {entries.length > 0 ? (
          <ChartsView 
            entries={entries} 
            dashboardName={dashboardConfig?.nome || sharedDashboard.title} 
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sem Dados</CardTitle>
              <CardDescription>
                Este dashboard não possui dados para exibir.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <p>© 2024 Unipão - Dashboard compartilhado para cooperados</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Atualizado em: {new Date(sharedDashboard.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SharedCustomDashboard;