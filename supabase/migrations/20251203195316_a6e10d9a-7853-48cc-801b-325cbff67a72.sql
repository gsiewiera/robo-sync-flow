-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  contact_person TEXT,
  offer_id UUID REFERENCES public.offers(id),
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salesperson_id UUID REFERENCES public.profiles(id),
  priority TEXT NOT NULL DEFAULT 'normal',
  contact_type TEXT NOT NULL DEFAULT 'other',
  note TEXT,
  needs TEXT,
  key_points TEXT,
  commitments_us TEXT,
  commitments_client TEXT,
  risks TEXT,
  next_step TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Salespeople can view own notes"
ON public.notes
FOR SELECT
USING (
  (salesperson_id = auth.uid()) 
  OR has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Salespeople can manage notes"
ON public.notes
FOR ALL
USING (
  has_role(auth.uid(), 'salesperson'::app_role) 
  OR has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();