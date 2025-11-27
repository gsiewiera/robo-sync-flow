-- Add new columns to offers table to support comprehensive offer details
ALTER TABLE public.offers
ADD COLUMN currency text DEFAULT 'PLN',
ADD COLUMN person_contact text,
ADD COLUMN initial_payment numeric DEFAULT 0,
ADD COLUMN prepayment_percent numeric,
ADD COLUMN prepayment_amount numeric,
ADD COLUMN warranty_period integer DEFAULT 12,
ADD COLUMN delivery_date date,
ADD COLUMN deployment_location text;

-- Add new columns to offer_items table to support contract type and warranty
ALTER TABLE public.offer_items
ADD COLUMN contract_type text DEFAULT 'purchase',
ADD COLUMN lease_months integer,
ADD COLUMN warranty_months integer,
ADD COLUMN warranty_price numeric DEFAULT 0;

-- Add comment to describe currency values
COMMENT ON COLUMN public.offers.currency IS 'Currency for the offer: USD, EUR, or PLN';
COMMENT ON COLUMN public.offer_items.contract_type IS 'Contract type: purchase or lease';