-- Fix function search_path security warning
CREATE OR REPLACE FUNCTION public.update_fiscal_report_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.fiscal_reports
    SET 
        approved_count = (SELECT COUNT(*) FROM public.fiscal_reviews WHERE fiscal_report_id = COALESCE(NEW.fiscal_report_id, OLD.fiscal_report_id) AND status = 'approved'),
        flagged_count = (SELECT COUNT(*) FROM public.fiscal_reviews WHERE fiscal_report_id = COALESCE(NEW.fiscal_report_id, OLD.fiscal_report_id) AND status = 'flagged'),
        pending_count = (SELECT COUNT(*) FROM public.fiscal_reviews WHERE fiscal_report_id = COALESCE(NEW.fiscal_report_id, OLD.fiscal_report_id) AND status = 'pending'),
        updated_at = now()
    WHERE id = COALESCE(NEW.fiscal_report_id, OLD.fiscal_report_id);
    RETURN COALESCE(NEW, OLD);
END;
$$;