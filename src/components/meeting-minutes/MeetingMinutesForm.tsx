
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CalendarIcon, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFiscalUsersFromRoles } from '@/hooks/useFiscalUsersFromRoles';
import { useAllFiscalReports } from '@/hooks/useFiscalReports';
import { useTreasurerReportsSummary } from '@/hooks/useTreasurerReportsSummary';
import { useMeetingMinutesActions } from '@/hooks/useMeetingMinutes';
import { useProfile } from '@/hooks/useProfile';
import { generateMinutesText } from '@/utils/meetingMinutesTemplate';
import { resolveSignatures, SignatureSource } from '@/utils/meetingSignatureResolver';
import { generateMeetingMinutesPDFBlob, MeetingMinutesPdfData } from '@/utils/meetingMinutesPdfGenerator';

interface MeetingMinutesFormProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

const MeetingMinutesForm = ({ onBack, onCreated }: MeetingMinutesFormProps) => {
  const { toast } = useToast();
  const { data: fiscalUsers = [], isLoading: isLoadingFiscais, isError: isErrorFiscais } = useFiscalUsersFromRoles();
  const { data: allReports = [], isLoading: isLoadingReports, isError: isErrorReports } = useAllFiscalReports();
  const { data: reportSummaries = [], isLoading: isLoadingSummaries } = useTreasurerReportsSummary();
  const { data: profile } = useProfile();
  const { createMinutes, updateMinutesStatus, saveSignatureSources } = useMeetingMinutesActions();

  const finishedReports = useMemo(() => {
    if (!reportSummaries.length) return [];
    return allReports.filter(r => {
      const summary = reportSummaries.find(s => s.reportId === r.id);
      if (!summary) return r.status === 'finished';
      return summary.isFinished || (
        summary.pendingTransactions === 0 &&
        summary.signatureCount >= 3 &&
        summary.allDiligencesConfirmed
      );
    });
  }, [allReports, reportSummaries]);

  const [meetingDate, setMeetingDate] = useState<Date>();
  const [meetingType, setMeetingType] = useState('ordinária');
  const [location, setLocation] = useState('');
  const [selectedFiscais, setSelectedFiscais] = useState<string[]>([]);
  const [convidados, setConvidados] = useState('');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [minutesText, setMinutesText] = useState('');
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [hadDiligencias, setHadDiligencias] = useState(false);
  const [diligencesSummary, setDiligencesSummary] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ ok: boolean; missing: string[]; resolved: Map<string, SignatureSource> } | null>(null);

  const tesoureiroNome = profile?.full_name || profile?.email || 'Tesoureiro';

  // Auto-generate text when selections change
  useEffect(() => {
    if (!meetingDate || selectedFiscais.length === 0 || selectedReportIds.length === 0) return;

    const fiscaisNomes = selectedFiscais.map(uid => {
      const user = fiscalUsers.find(u => u.userId === uid);
      return user?.fullName || 'Fiscal';
    });

    const convidadosNomes = convidados.split(',').map(s => s.trim()).filter(Boolean);

    const selectedReports = finishedReports.filter(r => selectedReportIds.includes(r.id));
    const competencias = [...new Set(selectedReports.map(r => r.competencia))];
    const competenciasTexto = competencias.join(', ');

    const text = generateMinutesText({
      meetingDate,
      meetingType,
      fiscaisNomes,
      tesoureiroNome,
      convidadosNomes,
      competenciasTexto,
      hasDiligencias: hadDiligencias,
      diligencesSummary: hadDiligencias ? diligencesSummary : undefined,
    });

    if (!manuallyEdited) {
      setMinutesText(text);
    }
    setValidationResult(null);
  }, [meetingDate, meetingType, selectedFiscais, selectedReportIds, convidados, fiscalUsers, finishedReports, tesoureiroNome, hadDiligencias, diligencesSummary, manuallyEdited]);

  const handleToggleFiscal = (userId: string) => {
    setSelectedFiscais(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleReport = (reportId: string) => {
    setSelectedReportIds(prev =>
      prev.includes(reportId) ? prev.filter(id => id !== reportId) : [...prev, reportId]
    );
  };

  const handleValidateSignatures = async () => {
    if (!meetingDate || selectedFiscais.length === 0 || selectedReportIds.length === 0) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsValidating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const requiredParticipants = [
        { userId: user.id, displayName: tesoureiroNome, role: 'tesoureiro' },
        ...selectedFiscais.map(uid => {
          const u = fiscalUsers.find(f => f.userId === uid);
          return { userId: uid, displayName: u?.fullName || 'Fiscal', role: 'fiscal' };
        }),
      ];

      const result = await resolveSignatures(requiredParticipants, selectedReportIds);

      if (result.missing.length > 0) {
        setValidationResult({ ok: false, missing: result.missing, resolved: result.resolved });
        toast({
          title: 'Assinaturas faltando',
          description: `Falta assinatura de: ${result.missing.join(', ')}`,
          variant: 'destructive',
        });
      } else {
        setValidationResult({ ok: true, missing: [], resolved: result.resolved });
        toast({ title: 'Todas as assinaturas encontradas!' });
      }
    } catch (error: any) {
      toast({ title: 'Erro na validação', description: error.message, variant: 'destructive' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!validationResult?.ok || !meetingDate) return;

    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Safeguard: auto-generate minutes text if empty
      let finalMinutesText = minutesText;
      if (!finalMinutesText.trim()) {
        const fiscaisNomes = selectedFiscais.map(uid => {
          const u = fiscalUsers.find(f => f.userId === uid);
          return u?.fullName || 'Fiscal';
        });
        const convidadosNomes = convidados.split(',').map(s => s.trim()).filter(Boolean);
        const selectedReportsForText = finishedReports.filter(r => selectedReportIds.includes(r.id));
        const competenciasTexto = [...new Set(selectedReportsForText.map(r => r.competencia))].join(', ');

        finalMinutesText = generateMinutesText({
          meetingDate,
          meetingType,
          fiscaisNomes,
          tesoureiroNome,
          convidadosNomes,
          competenciasTexto,
          hasDiligencias: hadDiligencias,
          diligencesSummary: hadDiligencias ? diligencesSummary : undefined,
        });
        setMinutesText(finalMinutesText);
      }

      // Build participants list
      const participants = [
        { user_id: user.id, participant_role: 'tesoureiro', display_name_snapshot: tesoureiroNome, is_required_signature: true },
        ...selectedFiscais.map(uid => {
          const u = fiscalUsers.find(f => f.userId === uid);
          return { user_id: uid, participant_role: 'fiscal', display_name_snapshot: u?.fullName || 'Fiscal', is_required_signature: true };
        }),
        ...convidados.split(',').map(s => s.trim()).filter(Boolean).map(name => ({
          user_id: user.id, // placeholder for guests
          participant_role: 'convidado',
          display_name_snapshot: name,
          is_required_signature: false,
        })),
      ];

      const dateStr = format(meetingDate, 'yyyy-MM-dd');
      const selectedReports = finishedReports.filter(r => selectedReportIds.includes(r.id));
      const competencias = [...new Set(selectedReports.map(r => r.competencia))].join(', ');
      const title = `Ata do Conselho Fiscal — ${competencias}`;

      // 1. Create the minutes record
      const result = await createMinutes.mutateAsync({
        title,
        meeting_date: dateStr,
        meeting_type: meetingType,
        location: location || undefined,
        created_by: user.id,
        minutes_text: finalMinutesText,
        participants,
        report_ids: selectedReportIds,
      });

      // 2. Save signature sources
      const sources = Array.from(validationResult.resolved.values()).map(sig => ({
        user_id: sig.userId,
        signature_payload: sig.signaturePayload,
        source_report_id: sig.sourceReportId,
        source_signature_id: sig.sourceSignatureId,
        signed_at_original: sig.signedAtOriginal,
      }));

      await saveSignatureSources.mutateAsync({ minutesId: result.id, sources });

      // 3. Fetch diligencias from selected reports
      const diligencias = await fetchDiligencias(selectedReportIds, selectedReports);

      // 4. Generate PDF
      const pdfData: MeetingMinutesPdfData = {
        title,
        minutesText: finalMinutesText,
        reports: selectedReports.map(r => ({ title: r.title, competencia: r.competencia, account_type: r.account_type })),
        diligencias,
        signatures: Array.from(validationResult.resolved.values()),
        diligencesSummary: hadDiligencias ? diligencesSummary : undefined,
      };

      const blob = await generateMeetingMinutesPDFBlob(pdfData);

      // 5. Upload PDF
      const filePath = `meeting-minutes/${result.id}/ata_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('fiscal-files')
        .upload(filePath, blob, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw uploadError;

      // 6. Update status
      const snapshot = {
        reports: selectedReports.map(r => ({ id: r.id, title: r.title, competencia: r.competencia })),
        participants: participants.map(p => ({ ...p })),
        signatures: sources,
        diligencias,
        had_diligences: hadDiligencias,
        diligences_summary: hadDiligencias ? diligencesSummary : null,
        minutes_text: finalMinutesText,
      };

      await updateMinutesStatus.mutateAsync({
        id: result.id,
        status: 'pdf_generated',
        snapshot,
        pdf_url: filePath,
      });

      toast({ title: 'Ata gerada com sucesso!' });
      onCreated(result.id);
    } catch (error: any) {
      toast({ title: 'Erro ao gerar ata', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold">Nova Ata do Conselho Fiscal</h2>
      </div>

      {/* Date & Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Reunião</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Data da Reunião *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !meetingDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {meetingDate ? format(meetingDate, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={meetingDate} onSelect={setMeetingDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Tipo de Reunião</Label>
            <Select value={meetingType} onValueChange={setMeetingType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ordinária">Ordinária</SelectItem>
                <SelectItem value="extraordinária">Extraordinária</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Local (opcional)</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Sede da Cooperativa" />
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Participantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tesoureiro - locked */}
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <Badge variant="secondary">Tesoureiro</Badge>
            <span className="font-medium">{tesoureiroNome}</span>
            <Badge variant="outline" className="ml-auto">Obrigatório</Badge>
          </div>

          {/* Fiscais */}
          <div>
            <Label className="mb-2 block">Fiscais *</Label>
            {isLoadingFiscais ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-44" />
              </div>
            ) : isErrorFiscais ? (
              <p className="text-sm text-destructive">Erro ao carregar fiscais. Verifique suas permissões.</p>
            ) : fiscalUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum fiscal cadastrado no sistema. Verifique se existem usuários com role "fiscal" na tabela user_roles.</p>
            ) : (
              <div className="space-y-2">
                {fiscalUsers.map(u => (
                  <div key={u.userId} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedFiscais.includes(u.userId)}
                      onCheckedChange={() => handleToggleFiscal(u.userId)}
                    />
                    <span>{u.fullName}</span>
                    <span className="text-xs text-muted-foreground">({u.email})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Convidados */}
          <div>
            <Label>Convidados (opcional, separados por vírgula)</Label>
            <Input value={convidados} onChange={e => setConvidados(e.target.value)} placeholder="Ex: João Silva, Maria Oliveira" />
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Relatórios Aprovados *</CardTitle>
          {finishedReports.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedReportIds.length === finishedReports.length) {
                  setSelectedReportIds([]);
                } else {
                  setSelectedReportIds(finishedReports.map(r => r.id));
                }
              }}
            >
              {selectedReportIds.length === finishedReports.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(isLoadingReports || isLoadingSummaries) ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isErrorReports ? (
            <p className="text-sm text-destructive">Erro ao carregar relatórios.</p>
          ) : finishedReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum relatório concluído disponível.
              {allReports.length > 0 && ` (${allReports.length} relatório(s) encontrado(s), mas nenhum atende aos critérios: 0 pendências, 3/3 assinaturas fiscais e diligências confirmadas).`}
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {finishedReports.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                  <Checkbox
                    checked={selectedReportIds.includes(r.id)}
                    onCheckedChange={() => handleToggleReport(r.id)}
                  />
                  <span className="font-medium">{r.title}</span>
                  <Badge variant="outline" className="ml-auto">{r.competencia}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diligências */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diligências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={hadDiligencias} onCheckedChange={setHadDiligencias} />
            <Label>Houve diligências nesta reunião?</Label>
          </div>
          {hadDiligencias && (
            <div>
              <Label className="mb-2 block">Resumo das diligências</Label>
              <Textarea
                value={diligencesSummary}
                onChange={e => setDiligencesSummary(e.target.value)}
                className="min-h-[100px]"
                placeholder="Descreva as diligências e observações registradas na reunião..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Texto da Ata</CardTitle>
          {manuallyEdited && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setManuallyEdited(false);
              }}
            >
              Regenerar texto automático
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Textarea
            value={minutesText}
            onChange={e => {
              setMinutesText(e.target.value);
              setManuallyEdited(true);
            }}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Selecione data, fiscais e relatórios para gerar o texto automaticamente..."
          />
        </CardContent>
      </Card>

      {/* Validation result */}
      {validationResult && (
        <Alert variant={validationResult.ok ? 'default' : 'destructive'}>
          {validationResult.ok ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            {validationResult.ok ? (
              <span>Todas as assinaturas encontradas ({validationResult.resolved.size} participantes). Pronto para gerar PDF.</span>
            ) : (
              <span>
                Não foi possível gerar a ata: falta assinatura de <strong>{validationResult.missing.join(', ')}</strong> nos relatórios selecionados. Selecione um relatório onde ele(a) assinou ou ajuste os participantes.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onBack}>Cancelar</Button>
        <Button
          variant="secondary"
          onClick={handleValidateSignatures}
          disabled={isValidating || !meetingDate || selectedFiscais.length === 0 || selectedReportIds.length === 0}
        >
          {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Validar Assinaturas
        </Button>
        <Button
          onClick={handleGeneratePDF}
          disabled={!validationResult?.ok || isGenerating}
        >
          {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <FileText className="h-4 w-4 mr-2" />
          Gerar PDF da Ata
        </Button>
      </div>
    </div>
  );
};

// Helper to fetch diligencias from selected reports
const fetchDiligencias = async (
  reportIds: string[],
  reports: { id: string; title: string }[]
): Promise<{ description: string; observation: string; reportTitle: string }[]> => {
  const diligencias: { description: string; observation: string; reportTitle: string }[] = [];

  for (const reportId of reportIds) {
    const report = reports.find(r => r.id === reportId);
    if (!report) continue;

    // Fetch divergent reviews from fiscal_user_reviews
    const { data: reviews } = await supabase
      .from('fiscal_user_reviews')
      .select('transaction_id, observation, status')
      .eq('report_id', reportId)
      .eq('status', 'divergent');

    if (!reviews || reviews.length === 0) continue;

    // Get unique transaction IDs with divergent status
    const txIds = [...new Set(reviews.map(r => r.transaction_id))];

    // Fetch transaction descriptions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, description, date, amount')
      .in('id', txIds);

    for (const txId of txIds) {
      const tx = transactions?.find(t => t.id === txId);
      const review = reviews.find(r => r.transaction_id === txId && r.observation);
      diligencias.push({
        description: tx ? `${tx.date} - ${tx.description} (R$ ${tx.amount?.toFixed(2)})` : txId,
        observation: review?.observation || '',
        reportTitle: report.title,
      });
    }
  }

  return diligencias;
};

export default MeetingMinutesForm;
