CREATE POLICY "Treasurer can upload fiscal files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fiscal-files'
  AND public.has_role(auth.uid(), 'tesoureiro'::public.app_role)
);

CREATE POLICY "Treasurer can read fiscal files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'fiscal-files'
  AND public.has_role(auth.uid(), 'tesoureiro'::public.app_role)
);