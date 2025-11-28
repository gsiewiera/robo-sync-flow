-- Create monthly revenue tracking table

CREATE TABLE public.monthly_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  forecast_amount numeric NOT NULL DEFAULT 0,
  actual_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PLN',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  UNIQUE(year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_revenue ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view revenue data
CREATE POLICY "All authenticated users can view revenue"
ON public.monthly_revenue
FOR SELECT
TO authenticated
USING (true);

-- Allow managers and admins to manage revenue data
CREATE POLICY "Managers and admins can manage revenue"
ON public.monthly_revenue
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_revenue_updated_at
BEFORE UPDATE ON public.monthly_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_monthly_revenue_year_month ON public.monthly_revenue(year, month);