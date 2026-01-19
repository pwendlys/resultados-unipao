import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FiscalReportFile {
  id: string;
  report_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  uploaded_by: string | null;
  created_at: string;
}

// Fetch file attached to a report
export const useFiscalReportFile = (reportId: string) => {
  return useQuery({
    queryKey: ['fiscal-report-file', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_report_files')
        .select('*')
        .eq('report_id', reportId)
        .eq('file_type', 'statement_pdf')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as FiscalReportFile | null;
    },
    enabled: !!reportId,
  });
};

// Upload statement PDF and create record
export const useUploadStatementFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      file,
      userId,
    }: {
      reportId: string;
      file: File;
      userId: string;
    }) => {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${reportId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('fiscal-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Delete any existing file record for this report
      await supabase
        .from('fiscal_report_files')
        .delete()
        .eq('report_id', reportId)
        .eq('file_type', 'statement_pdf');

      // Create database record
      const { data, error } = await supabase
        .from('fiscal_report_files')
        .insert({
          report_id: reportId,
          file_path: fileName,
          file_name: file.name,
          file_type: 'statement_pdf',
          uploaded_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-report-file', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-reports'] });
    },
  });
};

// Get signed URL for file download
export const useGetFileUrl = () => {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('fiscal-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    },
  });
};

// Delete file
export const useDeleteReportFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, filePath, reportId }: { fileId: string; filePath: string; reportId: string }) => {
      // Delete from storage
      await supabase.storage.from('fiscal-files').remove([filePath]);

      // Delete database record
      const { error } = await supabase
        .from('fiscal_report_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      return { reportId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-report-file', result.reportId] });
    },
  });
};
