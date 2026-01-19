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

// Upload statement PDF via Edge Function (works for admin and fiscal users)
export const useUploadStatementFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      file,
      isAdmin = false,
    }: {
      reportId: string;
      file: File;
      isAdmin?: boolean;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', reportId);

      // Build headers
      const headers: Record<string, string> = {};
      
      if (isAdmin) {
        // Admin request - no auth token needed, use special header
        headers['x-admin-request'] = 'true';
      } else {
        // Get current session for fiscal users
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(
        `https://snacxcwytxwldgaqlany.supabase.co/functions/v1/upload-fiscal-statement`,
        {
          method: 'POST',
          headers,
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      return result;
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
