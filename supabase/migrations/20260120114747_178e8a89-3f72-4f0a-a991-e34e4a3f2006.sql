-- Create RLS policy for treasurer to view all fiscal_user_reviews
DROP POLICY IF EXISTS "Treasurer can view all reviews" ON public.fiscal_user_reviews;

CREATE POLICY "Treasurer can view all reviews"
ON public.fiscal_user_reviews
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'tesoureiro')
);

-- Create RLS policy for treasurer to view all fiscal_reports
DROP POLICY IF EXISTS "Treasurer can view all reports" ON public.fiscal_reports;

CREATE POLICY "Treasurer can view all reports"
ON public.fiscal_reports
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'tesoureiro')
);

-- Create RLS policy for treasurer to view all fiscal_report_signatures
DROP POLICY IF EXISTS "Treasurer can view all signatures" ON public.fiscal_report_signatures;

CREATE POLICY "Treasurer can view all signatures"
ON public.fiscal_report_signatures
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'tesoureiro')
);

-- Ensure treasurer can delete reports
DROP POLICY IF EXISTS "Treasurer can delete reports" ON public.fiscal_reports;

CREATE POLICY "Treasurer can delete reports"
ON public.fiscal_reports
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'tesoureiro')
);

-- Ensure treasurer can update reports (for pdf_url and status)
DROP POLICY IF EXISTS "Treasurer can update reports" ON public.fiscal_reports;

CREATE POLICY "Treasurer can update reports"
ON public.fiscal_reports
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'tesoureiro')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'tesoureiro')
);