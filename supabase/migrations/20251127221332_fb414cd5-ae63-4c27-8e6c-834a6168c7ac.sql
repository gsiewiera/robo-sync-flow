-- Create storage bucket for offer PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-pdfs',
  'offer-pdfs',
  false,
  10485760,
  ARRAY['application/pdf']
);

-- Create offer_versions table to track PDF generations
CREATE TABLE public.offer_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  generated_by UUID,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT fk_offer FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE,
  CONSTRAINT fk_generated_by FOREIGN KEY (generated_by) REFERENCES public.profiles(id),
  CONSTRAINT unique_offer_version UNIQUE (offer_id, version_number)
);

-- Enable RLS
ALTER TABLE public.offer_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offer_versions
CREATE POLICY "Users can view offer versions"
ON public.offer_versions
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can create offer versions"
ON public.offer_versions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'salesperson'::app_role) 
  OR has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Storage policies for offer-pdfs bucket
CREATE POLICY "Users can view their offer PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'offer-pdfs' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Salespeople can upload offer PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'offer-pdfs'
  AND (
    has_role(auth.uid(), 'salesperson'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Create index for faster queries
CREATE INDEX idx_offer_versions_offer_id ON public.offer_versions(offer_id);
CREATE INDEX idx_offer_versions_generated_at ON public.offer_versions(generated_at DESC);