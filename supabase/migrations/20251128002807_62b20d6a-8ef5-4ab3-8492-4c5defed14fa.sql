-- Add stage column to offers table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'offers' AND column_name = 'stage'
  ) THEN
    ALTER TABLE public.offers 
    ADD COLUMN stage TEXT DEFAULT 'leads' 
    CHECK (stage IN ('leads', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'));
  END IF;
END $$;

-- Create index for faster stage queries
CREATE INDEX IF NOT EXISTS idx_offers_stage ON public.offers(stage);

-- Update existing offers to map status to stage
UPDATE public.offers 
SET stage = CASE 
  WHEN status = 'draft' THEN 'leads'
  WHEN status = 'sent' THEN 'proposal_sent'
  WHEN status = 'modified' THEN 'negotiation'
  WHEN status = 'accepted' THEN 'closed_won'
  WHEN status = 'rejected' THEN 'closed_lost'
  ELSE 'leads'
END
WHERE stage IS NULL OR stage = 'leads';