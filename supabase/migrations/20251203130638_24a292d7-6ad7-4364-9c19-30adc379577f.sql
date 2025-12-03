-- Add assigned company address to profiles
ALTER TABLE public.profiles
ADD COLUMN assigned_company_address_id uuid REFERENCES public.company_addresses(id) ON DELETE SET NULL;