-- Add address fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN address text,
ADD COLUMN city text,
ADD COLUMN postal_code text,
ADD COLUMN country text DEFAULT 'Poland';