-- Create service_ticket_documents table
CREATE TABLE public.service_ticket_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'general',
  notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_ticket_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view service ticket documents"
  ON public.service_ticket_documents
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage service ticket documents"
  ON public.service_ticket_documents
  FOR ALL
  USING (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create storage bucket for service ticket documents
INSERT INTO storage.buckets (id, name, public) VALUES ('service-ticket-documents', 'service-ticket-documents', true);

-- Storage policies
CREATE POLICY "Anyone can view service ticket documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-ticket-documents');

CREATE POLICY "Authenticated users can upload service ticket documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'service-ticket-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete service ticket documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'service-ticket-documents' AND auth.uid() IS NOT NULL);