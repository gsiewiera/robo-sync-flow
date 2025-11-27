-- Create system settings table for VAT rate and other configs
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default VAT rate
INSERT INTO public.system_settings (key, value) VALUES ('vat_rate', '23') ON CONFLICT (key) DO NOTHING;

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "Admins can manage settings" ON public.system_settings
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- All authenticated users can view settings
CREATE POLICY "All authenticated users can view settings" ON public.system_settings
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Dictionary for lease month options
CREATE TABLE IF NOT EXISTS public.lease_month_dictionary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  months integer UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default lease options
INSERT INTO public.lease_month_dictionary (months) VALUES (6), (12), (24), (36), (48) ON CONFLICT (months) DO NOTHING;

-- Enable RLS on lease_month_dictionary
ALTER TABLE public.lease_month_dictionary ENABLE ROW LEVEL SECURITY;

-- Admins can manage lease month dictionary
CREATE POLICY "Admins can manage lease months" ON public.lease_month_dictionary
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- All authenticated users can view lease months
CREATE POLICY "All authenticated users can view lease months" ON public.lease_month_dictionary
FOR SELECT USING (true);

-- Main pricing table
CREATE TABLE IF NOT EXISTS public.robot_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_model text NOT NULL,
  
  -- Sale section (net prices)
  sale_price_pln_net numeric NOT NULL,
  sale_price_usd_net numeric NOT NULL,
  sale_price_eur_net numeric NOT NULL,
  
  -- Promo prices (net, optional)
  promo_price_pln_net numeric,
  promo_price_usd_net numeric,
  promo_price_eur_net numeric,
  
  -- Lowest prices (net, admin only visibility - handled in UI)
  lowest_price_pln_net numeric,
  lowest_price_usd_net numeric,
  lowest_price_eur_net numeric,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(robot_model)
);

-- Enable RLS on robot_pricing
ALTER TABLE public.robot_pricing ENABLE ROW LEVEL SECURITY;

-- Admins can manage robot pricing
CREATE POLICY "Admins can manage robot pricing" ON public.robot_pricing
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- All authenticated users can view robot pricing
CREATE POLICY "All authenticated users can view robot pricing" ON public.robot_pricing
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Lease pricing table
CREATE TABLE IF NOT EXISTS public.lease_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_pricing_id uuid REFERENCES public.robot_pricing(id) ON DELETE CASCADE NOT NULL,
  months integer NOT NULL,
  price_pln_net numeric NOT NULL,
  price_usd_net numeric NOT NULL,
  price_eur_net numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(robot_pricing_id, months)
);

-- Enable RLS on lease_pricing
ALTER TABLE public.lease_pricing ENABLE ROW LEVEL SECURITY;

-- Admins can manage lease pricing
CREATE POLICY "Admins can manage lease pricing" ON public.lease_pricing
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- All authenticated users can view lease pricing
CREATE POLICY "All authenticated users can view lease pricing" ON public.lease_pricing
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_robot_pricing_updated_at
BEFORE UPDATE ON public.robot_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();