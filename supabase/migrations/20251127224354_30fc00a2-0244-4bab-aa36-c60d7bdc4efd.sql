-- Add new fields to clients table for general info and billing contact
ALTER TABLE public.clients 
  ADD COLUMN general_email TEXT,
  ADD COLUMN general_phone TEXT,
  ADD COLUMN website_url TEXT,
  ADD COLUMN billing_person_name TEXT,
  ADD COLUMN billing_person_email TEXT,
  ADD COLUMN billing_person_phone TEXT;