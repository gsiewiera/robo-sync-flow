-- Create a table for system numeric settings like km rate
CREATE TABLE IF NOT EXISTS public.system_numeric_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_numeric_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view settings
CREATE POLICY "All authenticated users can view numeric settings"
ON public.system_numeric_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage settings
CREATE POLICY "Admins can manage numeric settings"
ON public.system_numeric_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default km rate
INSERT INTO public.system_numeric_settings (setting_key, setting_value, description)
VALUES ('km_rate', 1.50, 'Cost per kilometer for travel calculations (in PLN)');