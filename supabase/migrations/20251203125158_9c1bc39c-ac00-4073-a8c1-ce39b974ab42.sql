-- Create company_addresses table for storing company location information
CREATE TABLE public.company_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address_type TEXT NOT NULL DEFAULT 'headquarters',
  label TEXT,
  address TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Poland',
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_addresses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view company addresses
CREATE POLICY "All authenticated users can view company addresses"
ON public.company_addresses
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage company addresses
CREATE POLICY "Admins can manage company addresses"
ON public.company_addresses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_company_addresses_updated_at
BEFORE UPDATE ON public.company_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();