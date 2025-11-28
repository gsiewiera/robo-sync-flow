-- Create table for sales funnel tracking
CREATE TABLE IF NOT EXISTS public.monthly_sales_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  stage TEXT NOT NULL CHECK (stage IN ('leads', 'qualified', 'proposals', 'negotiations', 'closed_won', 'closed_lost')),
  forecast_count INTEGER NOT NULL DEFAULT 0,
  actual_count INTEGER NOT NULL DEFAULT 0,
  forecast_value NUMERIC NOT NULL DEFAULT 0,
  actual_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PLN',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE(year, month, stage)
);

-- Enable RLS
ALTER TABLE public.monthly_sales_funnel ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view sales funnel data
CREATE POLICY "All authenticated users can view sales funnel"
  ON public.monthly_sales_funnel
  FOR SELECT
  USING (true);

-- Policy: Managers and admins can manage sales funnel data
CREATE POLICY "Managers and admins can manage sales funnel"
  ON public.monthly_sales_funnel
  FOR ALL
  USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_sales_funnel_updated_at
  BEFORE UPDATE ON public.monthly_sales_funnel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_monthly_sales_funnel_year_month ON public.monthly_sales_funnel(year, month);
CREATE INDEX idx_monthly_sales_funnel_stage ON public.monthly_sales_funnel(stage);