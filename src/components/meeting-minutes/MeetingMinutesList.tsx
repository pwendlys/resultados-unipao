
import { useState } from 'react';
import { useMeetingMinutes, MeetingMinutes } from '@/hooks/useMeetingMinutes';
import { useMeetingMinutesActions } from '@/hooks/useMeetingMinutes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Eye, Trash2, Download, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MeetingMinutesListProps {
  onNewMinutes: () => void;
  onViewDetail: (id: string) => void;
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  ready: 'Pronto',
  pdf_generated: 'PDF Gerado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  ready: 'default',
  pdf_generated: 'default',
};

const MeetingMinutesList = ({ onNewMinutes, onViewDetail }: MeetingMinutesListProps) => {
  const { data: minutes = [], isLoading } = useMeetingMinutes();
  const { deleteMinutes } = useMeetingMinutesActions();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<MeetingMinutes | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async (m: MeetingMinutes) => {
    if (!m.pdf_url) return;
    try {
      const { data } = await supabase.storage.from('fiscal-files').createSignedUrl(m.pdf_url, 300);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      toast({ title: 'Erro ao baixar PDF', variant: 'destructive' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMinutes.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error handled by mutation
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Atas do Conselho Fiscal</h2>
          <p className="text-muted-foreground">Gerencie as atas de reunião do conselho fiscal</p>
        </div>
        <Button onClick={onNewMinutes}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ata
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : minutes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma ata registrada</p>
            <Button variant="outline" className="mt-4" onClick={onNewMinutes}>
              Criar primeira ata
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {minutes.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{m.title}</CardTitle>
                  <Badge variant={statusVariants[m.status] || 'secondary'}>
                    {statusLabels[m.status] || m.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Data: {new Date(m.meeting_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    <p>Tipo: {m.meeting_type}</p>
                    {m.location && <p>Local: {m.location}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onViewDetail(m.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {m.pdf_url && (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(m)}>
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(m)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ata</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ata?
              {deleteTarget?.pdf_url && (
                <span className="block mt-2 font-medium">
                  A exclusão remove a ata e o PDF armazenado.
                </span>
              )}
              <span className="block mt-2 text-xs">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MeetingMinutesList;
