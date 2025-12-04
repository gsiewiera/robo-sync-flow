-- Add Try&Buy pricing columns to robot_pricing table
ALTER TABLE public.robot_pricing
ADD COLUMN IF NOT EXISTS try_buy_price_pln_net numeric NULL,
ADD COLUMN IF NOT EXISTS try_buy_price_usd_net numeric NULL,
ADD COLUMN IF NOT EXISTS try_buy_price_eur_net numeric NULL;