-- Create client_addresses table for multiple addresses per client
CREATE TABLE public.client_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL DEFAULT 'office',
  label TEXT,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Poland',
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view client addresses"
ON public.client_addresses
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage client addresses"
ON public.client_addresses
FOR ALL
USING (
  has_role(auth.uid(), 'salesperson'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_client_addresses_updated_at
BEFORE UPDATE ON public.client_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();