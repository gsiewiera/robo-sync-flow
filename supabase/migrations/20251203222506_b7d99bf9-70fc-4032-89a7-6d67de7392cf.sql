-- Create robot model documents table
CREATE TABLE public.robot_model_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  robot_model_id uuid NOT NULL REFERENCES public.robot_model_dictionary(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  category text DEFAULT 'general',
  notes text,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.robot_model_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "All authenticated users can view robot model documents"
ON public.robot_model_documents FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage robot model documents"
ON public.robot_model_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for robot model documents
INSERT INTO storage.buckets (id, name, public) VALUES ('robot-model-documents', 'robot-model-documents', true);

-- Storage policies
CREATE POLICY "Public can view robot model documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'robot-model-documents');

CREATE POLICY "Admins can upload robot model documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'robot-model-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete robot model documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'robot-model-documents' AND auth.uid() IS NOT NULL);