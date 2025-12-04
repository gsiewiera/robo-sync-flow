-- Create contract status dictionary table
CREATE TABLE public.contract_status_dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_status_dictionary ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "All authenticated users can view contract statuses"
  ON public.contract_status_dictionary
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage contract statuses"
  ON public.contract_status_dictionary
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default statuses (including new ones)
INSERT INTO public.contract_status_dictionary (name, color, display_order) VALUES
  ('draft', '#6b7280', 1),
  ('pending_signature', '#f59e0b', 2),
  ('signed', '#3b82f6', 3),
  ('waiting_for_deployment', '#8b5cf6', 4),
  ('active', '#22c55e', 5),
  ('expired', '#ef4444', 6),
  ('cancelled', '#6b7280', 7);

-- Change contracts.status from enum to text
ALTER TABLE public.contracts 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE TEXT USING status::TEXT,
  ALTER COLUMN status SET DEFAULT 'draft';