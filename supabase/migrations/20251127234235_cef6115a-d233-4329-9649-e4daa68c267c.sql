-- Add financial summary fields to contracts table
ALTER TABLE public.contracts
ADD COLUMN total_purchase_value numeric DEFAULT 0,
ADD COLUMN total_monthly_contracted numeric DEFAULT 0,
ADD COLUMN warranty_cost numeric DEFAULT 0,
ADD COLUMN implementation_cost numeric DEFAULT 0,
ADD COLUMN other_services_cost numeric DEFAULT 0,
ADD COLUMN other_services_description text;