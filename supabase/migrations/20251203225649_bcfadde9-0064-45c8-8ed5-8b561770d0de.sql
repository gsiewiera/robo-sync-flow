-- Create storage bucket for robot documents
INSERT INTO storage.buckets (id, name, public) VALUES ('robot-documents', 'robot-documents', true);

-- Create robot_documents table
CREATE TABLE public.robot_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  robot_id UUID NOT NULL REFERENCES public.robots(id) ON DELETE CASCADE,
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
ALTER TABLE public.robot_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view robot documents"
  ON public.robot_documents
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage robot documents"
  ON public.robot_documents
  FOR ALL
  USING (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Storage policies for robot-documents bucket
CREATE POLICY "Anyone can view robot documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'robot-documents');

CREATE POLICY "Authenticated users can upload robot documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'robot-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete robot documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'robot-documents' AND auth.uid() IS NOT NULL);