-- Tabela para armazenar a ordem das transações baseada no PDF anexado
CREATE TABLE public.fiscal_report_transaction_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES fiscal_reports(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  sort_index integer NOT NULL,
  matched boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(report_id, transaction_id)
);

-- Índices para performance
CREATE INDEX idx_fiscal_order_report ON fiscal_report_transaction_order(report_id);
CREATE INDEX idx_fiscal_order_sort ON fiscal_report_transaction_order(report_id, sort_index);

-- Habilitar RLS
ALTER TABLE fiscal_report_transaction_order ENABLE ROW LEVEL SECURITY;

-- Policy: Admin tem acesso total
CREATE POLICY "Admin full access to transaction order"
ON fiscal_report_transaction_order
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Policy: Fiscal pode ler
CREATE POLICY "Fiscal can read transaction order"
ON fiscal_report_transaction_order
FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'fiscal')));