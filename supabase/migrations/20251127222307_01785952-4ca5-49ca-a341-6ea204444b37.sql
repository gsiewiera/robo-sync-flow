-- Create manufacturer dictionary table
CREATE TABLE public.manufacturer_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manufacturer_dictionary ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view manufacturers
CREATE POLICY "All authenticated users can view manufacturers"
ON public.manufacturer_dictionary
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage manufacturers
CREATE POLICY "Admins can manage manufacturers"
ON public.manufacturer_dictionary
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add manufacturer column to robots table
ALTER TABLE public.robots
ADD COLUMN manufacturer TEXT;

-- Create index for better performance
CREATE INDEX idx_robots_manufacturer ON public.robots(manufacturer);