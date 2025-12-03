-- Add stock column to robot_model_dictionary
ALTER TABLE public.robot_model_dictionary 
ADD COLUMN stock integer DEFAULT 0;