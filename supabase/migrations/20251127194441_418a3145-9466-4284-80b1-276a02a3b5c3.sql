-- Create dictionaries table for task titles
CREATE TABLE IF NOT EXISTS public.task_title_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_title_dictionary ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view dictionary entries
CREATE POLICY "All authenticated users can view task title dictionary"
ON public.task_title_dictionary
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage dictionary entries
CREATE POLICY "Admins can manage task title dictionary"
ON public.task_title_dictionary
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Insert predefined task titles
INSERT INTO public.task_title_dictionary (title) VALUES
  ('Follow-up call'),
  ('Client meeting'),
  ('Proposal preparation'),
  ('Contract review'),
  ('Technical support'),
  ('Demo presentation'),
  ('Price negotiation'),
  ('Documentation update'),
  ('Site visit'),
  ('Training session')
ON CONFLICT (title) DO NOTHING;