-- Add service delivery manager column to clients table
ALTER TABLE public.clients 
ADD COLUMN assigned_sdm_id uuid REFERENCES auth.users(id);