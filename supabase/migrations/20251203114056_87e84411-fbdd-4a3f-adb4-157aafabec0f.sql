-- Add priority column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN priority text DEFAULT 'medium';

-- Add comment for clarity
COMMENT ON COLUMN public.tasks.priority IS 'Task priority: low, medium, high, urgent';