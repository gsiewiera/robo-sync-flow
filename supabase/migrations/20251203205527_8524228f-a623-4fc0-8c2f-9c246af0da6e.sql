-- Add due_date column to service_tickets table
ALTER TABLE public.service_tickets
ADD COLUMN due_date date;