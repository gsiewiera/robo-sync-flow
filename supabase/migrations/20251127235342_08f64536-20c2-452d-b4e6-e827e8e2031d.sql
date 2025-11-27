-- Add reseller relationships to clients, offers, and contracts

-- Add reseller_id to clients table
ALTER TABLE public.clients
ADD COLUMN reseller_id uuid REFERENCES public.resellers(id);

-- Add reseller_id to offers table
ALTER TABLE public.offers
ADD COLUMN reseller_id uuid REFERENCES public.resellers(id);

-- Add reseller_id to contracts table
ALTER TABLE public.contracts
ADD COLUMN reseller_id uuid REFERENCES public.resellers(id);

-- Add indexes for better query performance
CREATE INDEX idx_clients_reseller_id ON public.clients(reseller_id);
CREATE INDEX idx_offers_reseller_id ON public.offers(reseller_id);
CREATE INDEX idx_contracts_reseller_id ON public.contracts(reseller_id);