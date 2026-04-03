
CREATE OR REPLACE FUNCTION public.delete_meeting_minutes(p_minutes_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_by uuid;
  v_pdf_url text;
BEGIN
  -- Check the minutes exists and get metadata
  SELECT created_by, pdf_url INTO v_created_by, v_pdf_url
  FROM public.fiscal_meeting_minutes
  WHERE id = p_minutes_id;

  IF v_created_by IS NULL THEN
    RAISE EXCEPTION 'Ata não encontrada';
  END IF;

  -- Permission check: must be creator or admin
  IF auth.uid() != v_created_by AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Sem permissão para excluir esta ata';
  END IF;

  -- Delete children in order
  DELETE FROM public.fiscal_meeting_minutes_signature_sources WHERE minutes_id = p_minutes_id;
  DELETE FROM public.fiscal_meeting_minutes_reports WHERE minutes_id = p_minutes_id;
  DELETE FROM public.fiscal_meeting_minutes_participants WHERE minutes_id = p_minutes_id;

  -- Delete storage object if exists
  IF v_pdf_url IS NOT NULL AND v_pdf_url != '' THEN
    DELETE FROM storage.objects WHERE bucket_id = 'fiscal-files' AND name = v_pdf_url;
  END IF;

  -- Delete main record
  DELETE FROM public.fiscal_meeting_minutes WHERE id = p_minutes_id;
END;
$$;
