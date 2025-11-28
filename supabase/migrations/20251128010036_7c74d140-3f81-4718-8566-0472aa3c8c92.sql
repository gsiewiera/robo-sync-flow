-- Add lead tracking columns to offers table
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS next_action_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT,
ADD COLUMN IF NOT EXISTS last_contact_date DATE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_offers_next_action_date ON public.offers(next_action_date) WHERE stage = 'leads';
CREATE INDEX IF NOT EXISTS idx_offers_lead_status ON public.offers(lead_status) WHERE stage = 'leads';

-- Add constraint to ensure lead_status has valid values
ALTER TABLE public.offers
ADD CONSTRAINT check_lead_status CHECK (
  lead_status IN ('new', 'contacted', 'qualified', 'nurturing', 'follow_up_scheduled', 'on_hold')
);