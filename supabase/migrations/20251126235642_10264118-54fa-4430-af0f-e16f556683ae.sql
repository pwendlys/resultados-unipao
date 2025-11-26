-- Remove política de UPDATE incompleta
DROP POLICY IF EXISTS "Allow update for shared reports" ON public.shared_reports;

-- Cria nova política de UPDATE completa com WITH CHECK
CREATE POLICY "Allow update for shared reports"
ON public.shared_reports
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);