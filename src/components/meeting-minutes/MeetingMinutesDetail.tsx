
import { useMeetingMinutesById, useMeetingMinutesParticipants, useMeetingMinutesReports, useMeetingMinutesSignatureSources } from '@/hooks/useMeetingMinutes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Users, FileText, PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MeetingMinutesDetailProps {
  minutesId: string;
  onBack: () => void;
}

const MeetingMinutesDetail = ({ minutesId, onBack }: MeetingMinutesDetailProps) => {
  const { data: minutes, isLoading } = useMeetingMinutesById(minutesId);
  const { data: participants = [] } = useMeetingMinutesParticipants(minutesId);
  const { data: signatureSources = [] } = useMeetingMinutesSignatureSources(minutesId);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!minutes?.pdf_url) return;
    try {
      const { data } = await supabase.storage.from('fiscal-files').createSignedUrl(minutes.pdf_url, 300);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch {
      toast({ title: 'Erro ao baixar PDF', variant: 'destructive' });
    }
  };

  if (isLoading || !minutes) return <p className="text-muted-foreground">Carregando...</p>;

  const snapshot = minutes.snapshot as any;
  const snapshotReports = snapshot?.reports || [];
  const snapshotDiligencias = snapshot?.diligencias || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold">{minutes.title}</h2>
        </div>
        {minutes.pdf_url && (
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        )}
      </div>

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data:</span>
              <p className="font-medium">{new Date(minutes.meeting_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span>
              <p className="font-medium capitalize">{minutes.meeting_type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={minutes.status === 'pdf_generated' ? 'default' : 'secondary'}>
                {minutes.status === 'pdf_generated' ? 'PDF Gerado' : minutes.status === 'ready' ? 'Pronto' : 'Rascunho'}
              </Badge>
            </div>
            {minutes.location && (
              <div>
                <span className="text-muted-foreground">Local:</span>
                <p className="font-medium">{minutes.location}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <Badge variant="outline" className="capitalize">{p.participant_role}</Badge>
                <span className="font-medium">{p.display_name_snapshot || p.user_id}</span>
                {p.is_required_signature && <Badge variant="secondary" className="ml-auto text-xs">Assina</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Incluídos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {snapshotReports.map((r: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <span>{r.title}</span>
                <Badge variant="outline" className="ml-auto">{r.competencia}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diligencias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diligências Consolidadas</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshotDiligencias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma diligência registrada nos relatórios</p>
          ) : (
            <div className="space-y-3">
              {snapshotDiligencias.map((d: any, idx: number) => (
                <div key={idx} className="p-3 rounded bg-muted/50 border">
                  <p className="font-medium text-sm">{d.description}</p>
                  {d.observation && <p className="text-sm text-muted-foreground mt-1">Obs: {d.observation}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Relatório: {d.reportTitle}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Assinaturas Reutilizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {signatureSources.map(sig => {
              const participant = participants.find(p => p.user_id === sig.user_id);
              const sourceReport = snapshotReports.find((r: any) => r.id === sig.source_report_id);
              return (
                <div key={sig.id} className="p-3 rounded bg-muted/50 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{participant?.display_name_snapshot || sig.user_id}</p>
                      <p className="text-xs text-muted-foreground">
                        Assinatura obtida do Relatório: {sourceReport?.title || sig.source_report_id}
                      </p>
                      {sig.signed_at_original && (
                        <p className="text-xs text-muted-foreground">
                          Assinada originalmente em {new Date(sig.signed_at_original).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    {sig.signature_payload?.startsWith('data:image') && (
                      <img src={sig.signature_payload} alt="Assinatura" className="h-12 opacity-70" />
                    )}
                  </div>
                </div>
              );
            })}
            {signatureSources.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma assinatura registrada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Minutes text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Texto da Ata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-4 rounded">
            {minutes.minutes_text || 'Texto não disponível'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingMinutesDetail;
