-- Create robot type dictionary table
CREATE TABLE public.robot_type_dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.robot_type_dictionary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage robot types"
ON public.robot_type_dictionary
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view robot types"
ON public.robot_type_dictionary
FOR SELECT
USING (true);

-- Insert default robot types
INSERT INTO public.robot_type_dictionary (type_name) VALUES
  ('Delivery Robot'),
  ('Service Robot'),
  ('Cleaning Robot'),
  ('Hospitality Robot'),
  ('Industrial Robot'),
  ('Collaborative Robot');