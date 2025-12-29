import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileCheck, 
  ArrowRight,
  Calendar,
  Building2,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useFiscalReports } from '@/hooks/useFiscalReports';

interface FiscalReportsListProps {
  onNavigateToPage?: (page: string) => void;
}

const FiscalReportsList = ({ onNavigateToPage }: FiscalReportsListProps) => {
  const { data: reports = [], isLoading } = useFiscalReports();

  const getProgressPercentage = (report: typeof reports[0]) => {
    const total = report.total_entries || 0;
    if (total === 0) return 0;
    return Math.round(((report.approved_count || 0) + (report.flagged_count || 0)) / total * 100);
  };

  const getStatusInfo = (report: typeof reports[0]) => {
    switch (report.status) {
      case 'finished':
        return { label: 'Concluído', variant: 'default' as const, icon: CheckCircle };
      case 'locked':
        return { label: 'Bloqueado', variant: 'secondary' as const, icon: Clock };
      default:
        return { label: 'Em Andamento', variant: 'outline' as const, icon: Clock };
    }
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Relatórios para Revisão</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Selecione um relatório para iniciar a revisão das transações
        </p>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum relatório atribuído para revisão.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const statusInfo = getStatusInfo(report);
            const progress = getProgressPercentage(report);
            const StatusIcon = statusInfo.icon;

            return (
              <Card 
                key={report.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => onNavigateToPage?.(`fiscal-review/${report.id}`)}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{report.title}</h3>
                        <Badge variant={statusInfo.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {report.competencia}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {report.account_type}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="flex gap-3 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>{report.approved_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{report.flagged_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{report.pending_count || 0}</span>
                        </div>
                      </div>

                      <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FiscalReportsList;
