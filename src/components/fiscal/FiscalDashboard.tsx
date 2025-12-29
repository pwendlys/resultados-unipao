import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useFiscalReports } from '@/hooks/useFiscalReports';
import { useAuth } from '@/contexts/AuthContext';

interface FiscalDashboardProps {
  onNavigateToPage?: (page: string) => void;
}

const FiscalDashboard = ({ onNavigateToPage }: FiscalDashboardProps) => {
  const { user } = useAuth();
  const { data: reports = [], isLoading } = useFiscalReports();

  const stats = {
    total: reports.length,
    open: reports.filter(r => r.status === 'open').length,
    finished: reports.filter(r => r.status === 'finished').length,
    totalApproved: reports.reduce((sum, r) => sum + (r.approved_count || 0), 0),
    totalFlagged: reports.reduce((sum, r) => sum + (r.flagged_count || 0), 0),
    totalPending: reports.reduce((sum, r) => sum + (r.pending_count || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Painel Fiscal</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Bem-vindo, {user?.email}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Relatórios</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              <span className="text-2xl font-bold">{stats.open}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Em Aberto</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.totalApproved}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Aprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold">{stats.totalFlagged}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Divergências</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => onNavigateToPage?.('fiscal-reports')}
          >
            <span className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Ver Relatórios para Revisão
            </span>
            <div className="flex items-center gap-2">
              {stats.open > 0 && (
                <Badge variant="secondary">{stats.open} pendentes</Badge>
              )}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Relatórios Recentes</CardTitle>
          <CardDescription>Últimos relatórios atribuídos para revisão</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum relatório atribuído ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onNavigateToPage?.(`fiscal-review/${report.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{report.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.competencia} • {report.account_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge 
                      variant={report.status === 'finished' ? 'default' : 'outline'}
                      className={report.status === 'open' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''}
                    >
                      {report.status === 'open' ? 'Aberto' : 
                       report.status === 'finished' ? 'Concluído' : 'Bloqueado'}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
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

export default FiscalDashboard;
