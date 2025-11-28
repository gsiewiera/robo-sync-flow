-- Drop the status column from offers table since we'll use stage for everything
ALTER TABLE public.offers DROP COLUMN IF EXISTS status;

-- Update stage column to be NOT NULL with proper default
ALTER TABLE public.offers 
  ALTER COLUMN stage SET NOT NULL,
  ALTER COLUMN stage SET DEFAULT 'leads';

-- Create index on stage for better query performance
CREATE INDEX IF NOT EXISTS idx_offers_stage ON public.offers(stage);