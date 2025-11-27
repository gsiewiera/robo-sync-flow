-- Create storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-pdfs', 'contract-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Create contract_versions table
CREATE TABLE IF NOT EXISTS public.contract_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  generated_by UUID REFERENCES public.profiles(id),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(contract_id, version_number)
);

-- Enable RLS
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for contract_versions
CREATE POLICY "Users can view contract versions"
  ON public.contract_versions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can create contract versions"
  ON public.contract_versions
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'salesperson') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'admin')
  );

-- Storage policies for contract-pdfs bucket
CREATE POLICY "Users can view contract PDFs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'contract-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can upload contract PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contract-pdfs' AND (
      has_role(auth.uid(), 'salesperson') OR 
      has_role(auth.uid(), 'manager') OR 
      has_role(auth.uid(), 'admin')
    )
  );