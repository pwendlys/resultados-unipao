import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useFiscalReports } from '@/hooks/useFiscalReports';
import { useFiscalUserStats } from '@/hooks/useFiscalUserStats';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface FiscalDashboardProps {
  onNavigateToPage?: (page: string) => void;
}

const FiscalDashboard = ({ onNavigateToPage }: FiscalDashboardProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<{ email: string; id: string } | null>(null);
  
  const { data: reports = [], isLoading: reportsLoading } = useFiscalReports();
  const { data: userStatsData, isLoading: statsLoading } = useFiscalUserStats(supabaseUser?.id);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get Supabase Auth user directly
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser({
          email: session.user.email || 'Fiscal',
          id: session.user.id
        });
      }
    });
  }, []);

  const isLoading = reportsLoading || statsLoading || !supabaseUser;

  // Get report status for display
  const getReportUserStatus = (reportId: string) => {
    if (!userStatsData?.reportStatuses) return null;
    return userStatsData.reportStatuses.find(rs => rs.reportId === reportId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = userStatsData?.stats || {
    totalReports: 0,
    pendingActions: 0,
    completedReports: 0,
    totalDiligences: 0
  };

  return (
    <div className="space-y-6">
      {/* Header with Theme Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Painel Fiscal</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Bem-vindo(a), {supabaseUser?.email}
            </p>
          </div>
        </div>
        
        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>
        )}
      </div>

      {/* Stats Cards - User-specific data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalReports}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Relatórios</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.pendingActions}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.completedReports}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Aprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats.totalDiligences}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Diligências</p>
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
              {stats.pendingActions > 0 && (
                <Badge variant="secondary">{stats.pendingActions} pendentes</Badge>
              )}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports with User-specific Status */}
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
              {reports.slice(0, 5).map((report) => {
                const userStatus = getReportUserStatus(report.id);
                
                return (
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
                        variant={userStatus?.userStatus === 'completed' ? 'default' : 'outline'}
                        className={cn(
                          userStatus?.userStatus === 'pending' && 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
                          userStatus?.userStatus === 'waiting_others' && 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
                          userStatus?.userStatus === 'completed' && 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                        )}
                      >
                        {userStatus?.userStatus === 'pending' ? 'Aberto' : 
                         userStatus?.userStatus === 'completed' ? 'Concluído' : 
                         userStatus?.userStatus === 'waiting_others' ? 'Aguardando outros' :
                         'Aberto'}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FiscalDashboard;
