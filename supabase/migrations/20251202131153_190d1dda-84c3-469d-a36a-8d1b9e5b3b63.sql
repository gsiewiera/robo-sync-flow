-- Add lead_source column to offers table for tracking where leads come from
ALTER TABLE public.offers
ADD COLUMN lead_source text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.offers.lead_source IS 'Source of the lead: website, referral, cold_call, event, social_media, partner, other';