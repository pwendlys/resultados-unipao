import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  FileCheck, 
  Clock, 
  CheckCircle2,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAllFiscalReports } from '@/hooks/useFiscalReports';
import { useTreasurerReportsSummary } from '@/hooks/useTreasurerReportsSummary';

const TreasurerDashboard = () => {
  const { user } = useAuth();
  const { data: reports = [] } = useAllFiscalReports();
  const { data: summaries = [] } = useTreasurerReportsSummary();

  // Calculate counters from aggregated data
  const inProgress = summaries.filter(s => !s.isFinished).length;
  const readyForFinal = summaries.filter(s => 
    s.pendingTransactions === 0 && 
    s.signatureCount >= 3 && 
    s.allDiligencesConfirmed &&
    !s.isFinished
  ).length;
  const finalized = summaries.filter(s => s.isFinished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold">Painel do Tesoureiro</h1>
          <p className="text-muted-foreground">
            Acompanhamento e geração de relatórios fiscais finais
          </p>
        </div>
      </div>

      {/* User Info */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 flex items-center gap-3">
          <User className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm text-muted-foreground">Logado como</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <Badge className="ml-auto bg-amber-600">Tesoureiro</Badge>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Relatórios aguardando revisões ou assinaturas
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontos para Final</CardTitle>
            <FileCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{readyForFinal}</div>
            <p className="text-xs text-muted-foreground">
              0 pendentes + 3/3 assinaturas + diligências confirmadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{finalized}</div>
            <p className="text-xs text-muted-foreground">
              Relatórios com PDF final gerado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum relatório fiscal criado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => {
                const summary = summaries.find(s => s.reportId === report.id);
                return (
                  <div 
                    key={report.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.competencia} • {report.account_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {summary?.signatureCount ?? 0}/3
                      </Badge>
                      {summary?.isFinished ? (
                        <Badge className="bg-green-500">Concluído</Badge>
                      ) : summary?.pendingTransactions === 0 && (summary?.signatureCount ?? 0) >= 3 ? (
                        <Badge className="bg-amber-500">Pronto</Badge>
                      ) : (
                        <Badge variant="outline">Em Andamento</Badge>
                      )}
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

export default TreasurerDashboard;
