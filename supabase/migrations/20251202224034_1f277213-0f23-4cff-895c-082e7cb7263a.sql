-- Add assigned_salesperson_id to offers table
ALTER TABLE public.offers 
ADD COLUMN assigned_salesperson_id uuid REFERENCES public.profiles(id);

-- Create index for better query performance
CREATE INDEX idx_offers_assigned_salesperson ON public.offers(assigned_salesperson_id);