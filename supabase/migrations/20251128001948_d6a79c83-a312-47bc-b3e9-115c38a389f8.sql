-- Create table for monthly robots delivered tracking
CREATE TABLE IF NOT EXISTS public.monthly_robots_delivered (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  forecast_units INTEGER NOT NULL DEFAULT 0,
  actual_units INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE(year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_robots_delivered ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view robots delivered data
CREATE POLICY "All authenticated users can view robots delivered"
  ON public.monthly_robots_delivered
  FOR SELECT
  USING (true);

-- Policy: Managers and admins can manage robots delivered data
CREATE POLICY "Managers and admins can manage robots delivered"
  ON public.monthly_robots_delivered
  FOR ALL
  USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_robots_delivered_updated_at
  BEFORE UPDATE ON public.monthly_robots_delivered
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_monthly_robots_delivered_year_month ON public.monthly_robots_delivered(year, month);