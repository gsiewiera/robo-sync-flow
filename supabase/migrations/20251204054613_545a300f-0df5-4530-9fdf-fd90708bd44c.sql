-- Create table for contract line items (similar to offer_items)
CREATE TABLE public.contract_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  robot_model TEXT NOT NULL,
  contract_type TEXT DEFAULT 'purchase',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  lease_months INTEGER,
  monthly_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "All authenticated users can view contract_line_items"
  ON public.contract_line_items
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and salespeople can manage contract_line_items"
  ON public.contract_line_items
  FOR ALL
  USING (
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'salesperson'::app_role)
  );

-- Add index for faster lookups
CREATE INDEX idx_contract_line_items_contract_id ON public.contract_line_items(contract_id);