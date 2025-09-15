-- Add dashboard_id column to shared_reports table to support sharing custom dashboards
ALTER TABLE public.shared_reports 
ADD COLUMN dashboard_id UUID REFERENCES public.dashboards_personalizados(id) ON DELETE CASCADE;