-- Criar tabela de assinaturas do tesoureiro
CREATE TABLE public.treasurer_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  user_id uuid NOT NULL,
  signature_data text NOT NULL,
  display_name text,
  signed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (report_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.treasurer_signatures ENABLE ROW LEVEL SECURITY;

-- Tesoureiro pode inserir própria assinatura
CREATE POLICY "Treasurer can insert own signature"
ON public.treasurer_signatures
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'tesoureiro'::app_role));

-- Tesoureiro pode ver própria assinatura
CREATE POLICY "Treasurer can view own signature"
ON public.treasurer_signatures
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admin/Tesoureiro podem ver todas assinaturas para geração de PDF
CREATE POLICY "Admin and Treasurer can view all treasurer signatures"
ON public.treasurer_signatures
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'tesoureiro'::app_role));