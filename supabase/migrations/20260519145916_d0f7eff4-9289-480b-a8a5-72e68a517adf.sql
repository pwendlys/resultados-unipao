CREATE POLICY "Fiscal can view treasurer signatures"
ON public.treasurer_signatures
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'fiscal'::app_role));