-- Create client_documents table
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view client documents"
ON public.client_documents
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage client documents"
ON public.client_documents
FOR ALL
USING (
  has_role(auth.uid(), 'salesperson'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false);

-- Storage policies
CREATE POLICY "Authenticated users can view client documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can upload client documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' AND 
  (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Salespeople can delete client documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents' AND 
  (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);