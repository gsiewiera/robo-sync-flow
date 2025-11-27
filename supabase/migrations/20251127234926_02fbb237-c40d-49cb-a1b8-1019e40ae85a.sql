-- Create resellers table with same structure as clients
CREATE TABLE public.resellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Poland',
  website_url TEXT,
  general_email TEXT,
  general_phone TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  billing_person_name TEXT,
  billing_person_email TEXT,
  billing_person_phone TEXT,
  status TEXT DEFAULT 'active',
  balance NUMERIC DEFAULT 0,
  assigned_salesperson_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

-- Create policies similar to clients
CREATE POLICY "Salespeople can view own resellers"
ON public.resellers
FOR SELECT
USING (
  (has_role(auth.uid(), 'salesperson'::app_role) AND assigned_salesperson_id = auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Salespeople can insert resellers"
ON public.resellers
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'salesperson'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Salespeople can update own resellers"
ON public.resellers
FOR UPDATE
USING (
  (has_role(auth.uid(), 'salesperson'::app_role) AND assigned_salesperson_id = auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_resellers_updated_at
BEFORE UPDATE ON public.resellers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();