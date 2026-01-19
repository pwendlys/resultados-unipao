-- Create table for individual fiscal user reviews (per-fiscal approval)
CREATE TABLE public.fiscal_user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.fiscal_reports(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('approved', 'divergent')) DEFAULT 'approved',
  observation text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (report_id, transaction_id, user_id)
);

-- Enable RLS
ALTER TABLE public.fiscal_user_reviews ENABLE ROW LEVEL SECURITY;

-- Fiscal can manage their own reviews
CREATE POLICY "Fiscal can manage own reviews" ON public.fiscal_user_reviews
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can view all user reviews (for dashboard/reporting)
CREATE POLICY "Admin can view all user reviews" ON public.fiscal_user_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin')
  );

-- Create trigger for updated_at
CREATE TRIGGER update_fiscal_user_reviews_updated_at
  BEFORE UPDATE ON public.fiscal_user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();