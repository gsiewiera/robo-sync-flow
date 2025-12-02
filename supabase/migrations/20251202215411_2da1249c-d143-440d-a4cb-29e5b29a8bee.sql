-- Add evidence (cost) prices to robot_pricing table
ALTER TABLE public.robot_pricing 
ADD COLUMN evidence_price_pln_net numeric NULL,
ADD COLUMN evidence_price_usd_net numeric NULL,
ADD COLUMN evidence_price_eur_net numeric NULL;

-- Add evidence (cost) prices to lease_pricing table for monthly costs
ALTER TABLE public.lease_pricing 
ADD COLUMN evidence_price_pln_net numeric NULL,
ADD COLUMN evidence_price_usd_net numeric NULL,
ADD COLUMN evidence_price_eur_net numeric NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.robot_pricing.evidence_price_pln_net IS 'Cost/purchase price in PLN (net)';
COMMENT ON COLUMN public.robot_pricing.evidence_price_usd_net IS 'Cost/purchase price in USD (net)';
COMMENT ON COLUMN public.robot_pricing.evidence_price_eur_net IS 'Cost/purchase price in EUR (net)';
COMMENT ON COLUMN public.lease_pricing.evidence_price_pln_net IS 'Monthly cost in PLN (net)';
COMMENT ON COLUMN public.lease_pricing.evidence_price_usd_net IS 'Monthly cost in USD (net)';
COMMENT ON COLUMN public.lease_pricing.evidence_price_eur_net IS 'Monthly cost in EUR (net)';