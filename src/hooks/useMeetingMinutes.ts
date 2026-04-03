
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MeetingMinutes {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: string;
  location: string | null;
  created_by: string;
  minutes_text: string | null;
  status: string;
  snapshot: any;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  minutes_id: string;
  user_id: string;
  participant_role: string;
  display_name_snapshot: string | null;
  is_required_signature: boolean;
  created_at: string;
}

export interface MeetingReport {
  id: string;
  minutes_id: string;
  fiscal_report_id: string;
  approved: boolean;
  created_at: string;
}

export interface MeetingSignatureSource {
  id: string;
  minutes_id: string;
  user_id: string;
  signature_payload: string;
  source_report_id: string;
  source_signature_id: string | null;
  signed_at_original: string | null;
  created_at: string;
}

export const useMeetingMinutes = () => {
  return useQuery({
    queryKey: ['meeting-minutes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_meeting_minutes')
        .select('*')
        .order('meeting_date', { ascending: false });
      if (error) throw error;
      return data as MeetingMinutes[];
    },
  });
};

export const useMeetingMinutesById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['meeting-minutes', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('fiscal_meeting_minutes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as MeetingMinutes;
    },
    enabled: !!id,
  });
};

export const useMeetingMinutesParticipants = (minutesId: string | undefined) => {
  return useQuery({
    queryKey: ['meeting-minutes-participants', minutesId],
    queryFn: async () => {
      if (!minutesId) return [];
      const { data, error } = await supabase
        .from('fiscal_meeting_minutes_participants')
        .select('*')
        .eq('minutes_id', minutesId);
      if (error) throw error;
      return data as MeetingParticipant[];
    },
    enabled: !!minutesId,
  });
};

export const useMeetingMinutesReports = (minutesId: string | undefined) => {
  return useQuery({
    queryKey: ['meeting-minutes-reports', minutesId],
    queryFn: async () => {
      if (!minutesId) return [];
      const { data, error } = await supabase
        .from('fiscal_meeting_minutes_reports')
        .select('*')
        .eq('minutes_id', minutesId);
      if (error) throw error;
      return data as MeetingReport[];
    },
    enabled: !!minutesId,
  });
};

export const useMeetingMinutesSignatureSources = (minutesId: string | undefined) => {
  return useQuery({
    queryKey: ['meeting-minutes-signature-sources', minutesId],
    queryFn: async () => {
      if (!minutesId) return [];
      const { data, error } = await supabase
        .from('fiscal_meeting_minutes_signature_sources')
        .select('*')
        .eq('minutes_id', minutesId);
      if (error) throw error;
      return data as MeetingSignatureSource[];
    },
    enabled: !!minutesId,
  });
};

export const useMeetingMinutesActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMinutes = useMutation({
    mutationFn: async (params: {
      title: string;
      meeting_date: string;
      meeting_type: string;
      location?: string;
      created_by: string;
      minutes_text: string;
      participants: { user_id: string; participant_role: string; display_name_snapshot: string; is_required_signature: boolean }[];
      report_ids: string[];
    }) => {
      // Create the minutes record
      const { data: minutes, error: minutesError } = await supabase
        .from('fiscal_meeting_minutes')
        .insert({
          title: params.title,
          meeting_date: params.meeting_date,
          meeting_type: params.meeting_type,
          location: params.location || null,
          created_by: params.created_by,
          minutes_text: params.minutes_text,
          status: 'draft',
        })
        .select()
        .single();

      if (minutesError) throw minutesError;

      // Create participants
      if (params.participants.length > 0) {
        const { error: partError } = await supabase
          .from('fiscal_meeting_minutes_participants')
          .insert(params.participants.map(p => ({
            minutes_id: minutes.id,
            user_id: p.user_id,
            participant_role: p.participant_role,
            display_name_snapshot: p.display_name_snapshot,
            is_required_signature: p.is_required_signature,
          })));
        if (partError) throw partError;
      }

      // Create report links
      if (params.report_ids.length > 0) {
        const { error: repError } = await supabase
          .from('fiscal_meeting_minutes_reports')
          .insert(params.report_ids.map(rid => ({
            minutes_id: minutes.id,
            fiscal_report_id: rid,
          })));
        if (repError) throw repError;
      }

      return minutes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes'] });
      toast({ title: 'Ata criada com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar ata', description: error.message, variant: 'destructive' });
    },
  });

  const updateMinutesStatus = useMutation({
    mutationFn: async ({ id, status, snapshot, pdf_url }: { id: string; status: string; snapshot?: any; pdf_url?: string }) => {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (snapshot !== undefined) updateData.snapshot = snapshot;
      if (pdf_url !== undefined) updateData.pdf_url = pdf_url;

      const { error } = await supabase
        .from('fiscal_meeting_minutes')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes'] });
    },
  });

  const updateMinutesText = useMutation({
    mutationFn: async ({ id, minutes_text }: { id: string; minutes_text: string }) => {
      const { error } = await supabase
        .from('fiscal_meeting_minutes')
        .update({ minutes_text, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes'] });
    },
  });

  const saveSignatureSources = useMutation({
    mutationFn: async (params: {
      minutesId: string;
      sources: { user_id: string; signature_payload: string; source_report_id: string; source_signature_id: string | null; signed_at_original: string }[];
    }) => {
      // Delete existing sources for this minutes
      await supabase
        .from('fiscal_meeting_minutes_signature_sources')
        .delete()
        .eq('minutes_id', params.minutesId);

      if (params.sources.length > 0) {
        const { error } = await supabase
          .from('fiscal_meeting_minutes_signature_sources')
          .insert(params.sources.map(s => ({
            minutes_id: params.minutesId,
            user_id: s.user_id,
            signature_payload: s.signature_payload,
            source_report_id: s.source_report_id,
            source_signature_id: s.source_signature_id,
            signed_at_original: s.signed_at_original,
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes-signature-sources'] });
    },
  });

  const deleteMinutes = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_meeting_minutes', { p_minutes_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes'] });
      toast({ title: 'Ata excluída com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir ata', description: error.message, variant: 'destructive' });
    },
  });

  return { createMinutes, updateMinutesStatus, updateMinutesText, saveSignatureSources, deleteMinutes };
};
