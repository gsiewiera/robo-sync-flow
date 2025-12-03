-- Create robot model dictionary table
CREATE TABLE public.robot_model_dictionary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.robot_model_dictionary ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "All authenticated users can view robot models"
ON public.robot_model_dictionary
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage robot models"
ON public.robot_model_dictionary
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the robot models from robot_pricing
INSERT INTO public.robot_model_dictionary (model_name)
SELECT DISTINCT robot_model FROM public.robot_pricing
ORDER BY robot_model;