-- Add manufacturer column to robot_model_dictionary
ALTER TABLE public.robot_model_dictionary 
ADD COLUMN IF NOT EXISTS manufacturer text;