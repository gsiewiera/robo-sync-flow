-- Create client_size_dictionary table
CREATE TABLE public.client_size_dictionary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create junction table for client sizes
CREATE TABLE public.client_sizes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  size_id uuid NOT NULL REFERENCES public.client_size_dictionary(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id, size_id)
);

-- Enable RLS
ALTER TABLE public.client_size_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sizes ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_size_dictionary
CREATE POLICY "All authenticated users can view client sizes" ON public.client_size_dictionary
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage client sizes" ON public.client_size_dictionary
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for client_sizes junction table
CREATE POLICY "Users can view client sizes" ON public.client_sizes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage client sizes" ON public.client_sizes
  FOR ALL USING (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Insert sample values
INSERT INTO public.client_size_dictionary (name) VALUES
  ('Small'),
  ('Medium'),
  ('Large');