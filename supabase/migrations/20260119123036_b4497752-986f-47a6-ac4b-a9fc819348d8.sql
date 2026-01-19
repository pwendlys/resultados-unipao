-- Create table for storing statement PDF files attached to fiscal reports
CREATE TABLE public.fiscal_report_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.fiscal_reports(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text DEFAULT 'statement_pdf',
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_report_files ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access to fiscal report files"
  ON public.fiscal_report_files
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Fiscal users can read files
CREATE POLICY "Fiscal can read fiscal report files"
  ON public.fiscal_report_files
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'fiscal')));

-- Create storage bucket for fiscal files
INSERT INTO storage.buckets (id, name, public)
VALUES ('fiscal-files', 'fiscal-files', false)
ON CONFLICT (id) DO NOTHING;

-- Admin can upload to fiscal-files bucket
CREATE POLICY "Admin can upload fiscal files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'fiscal-files' 
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admin and fiscal can read fiscal files
CREATE POLICY "Authorized users can read fiscal files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'fiscal-files' 
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'fiscal'))
  );

-- Admin can delete fiscal files
CREATE POLICY "Admin can delete fiscal files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'fiscal-files' 
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );