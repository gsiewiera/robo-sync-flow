-- Create robot status dictionary table
CREATE TABLE public.robot_status_dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.robot_status_dictionary ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage robot statuses"
ON public.robot_status_dictionary
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view robot statuses"
ON public.robot_status_dictionary
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default statuses
INSERT INTO public.robot_status_dictionary (name) VALUES
  ('in_stock'),
  ('deployed'),
  ('in_service'),
  ('decommissioned'),
  ('reserved');