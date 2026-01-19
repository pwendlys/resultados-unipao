import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  Trash2, 
  Eye, 
  Download, 
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  PenTool
} from 'lucide-react';
import { useAllFiscalReports, useFiscalReportsActions } from '@/hooks/useFiscalReports';
import { useFiscalReviews } from '@/hooks/useFiscalReviews';
import { useFiscalSignatures } from '@/hooks/useFiscalSignatures';
import { useToast } from '@/hooks/use-toast';
import { generateFiscalPDF } from '@/utils/fiscalPdfGenerator';

interface AdminFiscalReportsProps {
  onNavigateToPage?: (page: string) => void;
}

const AdminFiscalReports = ({ onNavigateToPage }: AdminFiscalReportsProps) => {
  const { toast } = useToast();
  const { data: reports = [], isLoading } = useAllFiscalReports();
  const { deleteFiscalReport } = useFiscalReportsActions();
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    reportId: string | null;
    reportTitle: string;
  }>({ open: false, reportId: null, reportTitle: '' });

  const handleDelete = async () => {
    if (!deleteDialog.reportId) return;

    try {
      await deleteFiscalReport.mutateAsync(deleteDialog.reportId);
      toast({
        title: "Relatório excluído",
        description: "O relatório e todas as suas revisões e assinaturas foram removidos.",
      });
      setDeleteDialog({ open: false, reportId: null, reportTitle: '' });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o relatório.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'locked':
        return <Badge variant="secondary">Travado</Badge>;
      default:
        return <Badge variant="outline">Em Andamento</Badge>;
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
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Área Fiscal - Gestão de Relatórios</h1>
          <p className="text-muted-foreground">
            Gerencie todos os relatórios enviados para o conselho fiscal
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum relatório fiscal foi criado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Fiscais ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Assinaturas</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <ReportRow 
                      key={report.id} 
                      report={report}
                      onView={() => window.location.href = `/fiscal?report=${report.id}`}
                      onDelete={() => setDeleteDialog({
                        open: true,
                        reportId: report.id,
                        reportTitle: report.title,
                      })}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório "{deleteDialog.reportTitle}"?
              <br /><br />
              <strong className="text-destructive">
                Esta ação é irreversível e removerá todas as revisões e assinaturas associadas.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Relatório
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Componente separado para cada linha da tabela
interface ReportRowProps {
  report: any;
  onView: () => void;
  onDelete: () => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const ReportRow = ({ report, onView, onDelete, getStatusBadge }: ReportRowProps) => {
  const { toast } = useToast();
  const { data: reviews = [] } = useFiscalReviews(report.id);
  const { data: signatures = [] } = useFiscalSignatures(report.id);

  const totalReviews = reviews.length || report.total_entries || 0;
  const approvedCount = reviews.filter(r => r.status === 'approved').length || report.approved_count || 0;
  const flaggedCount = reviews.filter(r => r.status === 'flagged').length || report.flagged_count || 0;
  const pendingCount = reviews.filter(r => r.status === 'pending').length || report.pending_count || 0;
  
  const progressPercentage = totalReviews > 0 
    ? Math.round((approvedCount + flaggedCount) / totalReviews * 100) 
    : 0;

  const signatureCount = signatures.length;
  const isFinished = report.status === 'finished' || (pendingCount === 0 && flaggedCount === 0 && signatureCount >= 3);

  const handleExportPDF = () => {
    if (!isFinished) {
      toast({
        title: "Exportação não permitida",
        description: "O relatório precisa estar concluído para exportar o PDF.",
        variant: "destructive",
      });
      return;
    }
    generateFiscalPDF(report, reviews, signatures);
    toast({
      title: "PDF Gerado",
      description: "O relatório foi exportado com sucesso.",
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{report.title}</TableCell>
      <TableCell>{report.competencia}</TableCell>
      <TableCell>{report.account_type}</TableCell>
      <TableCell>{getStatusBadge(report.status)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2 min-w-[150px]">
          <Progress value={progressPercentage} className="h-2 w-16" />
          <div className="flex items-center gap-1 text-xs">
            <span className="text-green-600">{approvedCount}</span>
            <span>/</span>
            <span className="text-muted-foreground">{pendingCount}</span>
            <span>/</span>
            <span className="text-destructive">{flaggedCount}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <PenTool className="h-4 w-4 text-muted-foreground" />
          <span className={signatureCount >= 3 ? 'text-green-600 font-medium' : ''}>
            {signatureCount}/3
          </span>
        </div>
      </TableCell>
      <TableCell>
        {new Date(report.created_at).toLocaleDateString('pt-BR')}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={onView} title="Visualizar">
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleExportPDF}
            disabled={!isFinished}
            title={isFinished ? "Exportar PDF" : "Disponível apenas para relatórios concluídos"}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default AdminFiscalReports;
