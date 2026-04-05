
-- 1. Replace the delete_meeting_minutes function WITHOUT the storage.objects DELETE
CREATE OR REPLACE FUNCTION public.delete_meeting_minutes(p_minutes_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_created_by uuid;
BEGIN
  SELECT created_by INTO v_created_by
  FROM public.fiscal_meeting_minutes
  WHERE id = p_minutes_id;

  IF v_created_by IS NULL THEN
    RAISE EXCEPTION 'Ata não encontrada';
  END IF;

  IF auth.uid() != v_created_by AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Sem permissão para excluir esta ata';
  END IF;

  DELETE FROM public.fiscal_meeting_minutes_signature_sources WHERE minutes_id = p_minutes_id;
  DELETE FROM public.fiscal_meeting_minutes_reports WHERE minutes_id = p_minutes_id;
  DELETE FROM public.fiscal_meeting_minutes_participants WHERE minutes_id = p_minutes_id;
  DELETE FROM public.fiscal_meeting_minutes WHERE id = p_minutes_id;
END;
$function$;

-- 2. Add DELETE policy on storage.objects for tesoureiro and admin
CREATE POLICY "Treasurer and admin can delete fiscal files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'fiscal-files'
  AND (
    public.has_role(auth.uid(), 'tesoureiro'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
