-- Create contract email history table
CREATE TABLE IF NOT EXISTS public.contract_email_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_version_id UUID NOT NULL REFERENCES public.contract_versions(id) ON DELETE CASCADE,
  sent_to TEXT NOT NULL,
  sent_by UUID REFERENCES public.profiles(id),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_email_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view contract email history"
  ON public.contract_email_history
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert contract email history"
  ON public.contract_email_history
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for performance
CREATE INDEX idx_contract_email_history_version_id ON public.contract_email_history(contract_version_id);
CREATE INDEX idx_contract_email_history_sent_at ON public.contract_email_history(sent_at DESC);