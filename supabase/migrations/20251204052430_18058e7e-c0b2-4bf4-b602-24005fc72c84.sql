-- Add color column to robot_status_dictionary
ALTER TABLE public.robot_status_dictionary 
ADD COLUMN color TEXT DEFAULT '#6b7280';

-- Update default statuses with colors
UPDATE public.robot_status_dictionary SET color = '#22c55e' WHERE name = 'in_stock';
UPDATE public.robot_status_dictionary SET color = '#3b82f6' WHERE name = 'deployed';
UPDATE public.robot_status_dictionary SET color = '#f59e0b' WHERE name = 'in_service';
UPDATE public.robot_status_dictionary SET color = '#ef4444' WHERE name = 'decommissioned';
UPDATE public.robot_status_dictionary SET color = '#8b5cf6' WHERE name = 'reserved';