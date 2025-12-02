-- Add category to client_documents
ALTER TABLE public.client_documents ADD COLUMN category TEXT DEFAULT 'general';

-- Create document categories dictionary
CREATE TABLE public.document_category_dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_category_dictionary ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "All authenticated users can view document categories"
ON public.document_category_dictionary
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage document categories"
ON public.document_category_dictionary
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.document_category_dictionary (name) VALUES 
  ('General'),
  ('Contract'),
  ('Invoice'),
  ('Offer'),
  ('Technical'),
  ('Legal'),
  ('Correspondence');