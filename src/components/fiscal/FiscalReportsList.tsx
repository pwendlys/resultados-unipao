import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileCheck, 
  ArrowRight,
  Calendar,
  Building2,
  CheckCircle,
  AlertTriangle,
  Clock,
  PenTool,
  FileText
} from 'lucide-react';
import { useFiscalReports } from '@/hooks/useFiscalReports';
import { useReportsListStats } from '@/hooks/useReportsListStats';
import { cn } from '@/lib/utils';

interface FiscalReportsListProps {
  onNavigateToPage?: (page: string) => void;
}

interface ProgressResult {
  progress: number;
  label: string;
  statusLabel: string;
  statusVariant: 'default' | 'secondary' | 'outline';
  barColor: string;
}

const computeReportProgress = (
  report: { total_entries: number | null; pending_count: number | null; pdf_url: string | null; status: string },
  signatureCount: number
): ProgressResult => {
  // A) Finalizado: treasurer generated final PDF
  if (report.pdf_url || report.status === 'finished') {
    return {
      progress: 100,
      label: 'Finalizado',
      statusLabel: 'Finalizado',
      statusVariant: 'default',
      barColor: 'bg-green-500',
    };
  }

  // B) 3/3 fiscal signatures
  if (signatureCount >= 3) {
    return {
      progress: 90,
      label: 'Aguardando Tesouraria',
      statusLabel: 'Aguardando Tesouraria',
      statusVariant: 'secondary',
      barColor: 'bg-amber-500',
    };
  }

  // C) In progress
  const total = report.total_entries || 0;
  const pending = report.pending_count || 0;
  if (total === 0) {
    return {
      progress: 0,
      label: 'Em Revisão',
      statusLabel: 'Em Andamento',
      statusVariant: 'outline',
      barColor: 'bg-primary',
    };
  }

  const reviewed = total - pending;
  const base = Math.floor((reviewed / total) * 80);
  const progress = Math.min(base + signatureCount * 3, 89);

  return {
    progress,
    label: 'Em Revisão',
    statusLabel: 'Em Andamento',
    statusVariant: 'outline',
    barColor: 'bg-primary',
  };
};

const FiscalReportsList = ({ onNavigateToPage }: FiscalReportsListProps) => {
  const { data: reports = [], isLoading } = useFiscalReports();
  
  const reportIds = reports.map(r => r.id);
  const { data: reportStats = {} } = useReportsListStats(reportIds);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Relatórios para Revisão</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Selecione um relatório para iniciar a revisão das transações
        </p>
      </div>

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
            const stats = reportStats[report.id];
            const signatureCount = stats?.signatureCount || 0;
            const diligenceCount = stats?.diligenceCount || 0;
            const noChangeCount = Math.max(0, (report.approved_count || 0) - diligenceCount);
            const hasFinalPdf = !!(report.pdf_url || report.status === 'finished');

            const prog = computeReportProgress(report, signatureCount);

            return (
              <Card 
                key={report.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => onNavigateToPage?.(`fiscal-review/${report.id}`)}
              >
                <CardContent className="p-4 md:p-6 space-y-4">
                  {/* Row 1: Title + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate text-base">{report.title}</h3>
                        <Badge variant={prog.statusVariant}>
                          {prog.statusLabel}
                        </Badge>
                      </div>

                      {/* Row 2: Meta */}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {report.competencia}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {report.account_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: KPIs */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <span className="flex items-center gap-1.5 text-green-600" title="Sem Alterações">
                      <CheckCircle className="h-4 w-4" />
                      Aprovadas: {noChangeCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-orange-500" title="Diligências">
                      <AlertTriangle className="h-4 w-4" />
                      Diligências: {diligenceCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground" title="Pendentes">
                      <Clock className="h-4 w-4" />
                      Pendentes: {report.pending_count || 0}
                    </span>
                    <span className={cn("flex items-center gap-1.5", signatureCount >= 3 ? 'text-green-600' : 'text-muted-foreground')} title="Assinaturas Fiscais">
                      <PenTool className="h-4 w-4" />
                      Fiscais: {signatureCount}/3
                    </span>
                    <span className={cn("flex items-center gap-1.5", hasFinalPdf ? 'text-green-600' : 'text-muted-foreground')} title="PDF Final Tesouraria">
                      <FileText className="h-4 w-4" />
                      Tesouraria: {hasFinalPdf ? 'Sim' : 'Não'}
                    </span>
                  </div>

                  {/* Row 4: Progress + CTA */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{prog.label}</span>
                        <span className="font-medium">{prog.progress}%</span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn("h-full rounded-full transition-all", prog.barColor)}
                          style={{ width: `${prog.progress}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="default"
                      className="shrink-0 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToPage?.(`fiscal-review/${report.id}`);
                      }}
                    >
                      Abrir
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
