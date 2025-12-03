-- Add bank account details for PLN, EUR, USD
ALTER TABLE public.company_info
ADD COLUMN bank_name_pln text,
ADD COLUMN bank_account_pln text,
ADD COLUMN bank_swift_pln text,
ADD COLUMN bank_iban_pln text,
ADD COLUMN bank_name_eur text,
ADD COLUMN bank_account_eur text,
ADD COLUMN bank_swift_eur text,
ADD COLUMN bank_iban_eur text,
ADD COLUMN bank_name_usd text,
ADD COLUMN bank_account_usd text,
ADD COLUMN bank_swift_usd text,
ADD COLUMN bank_iban_usd text;

-- Add social media links
ALTER TABLE public.company_info
ADD COLUMN facebook_url text,
ADD COLUMN linkedin_url text,
ADD COLUMN instagram_url text,
ADD COLUMN twitter_url text,
ADD COLUMN youtube_url text;