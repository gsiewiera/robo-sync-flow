-- Add additional columns to robot_model_dictionary for full model management
ALTER TABLE public.robot_model_dictionary 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'Delivery Robot',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create trigger for updated_at
CREATE TRIGGER update_robot_model_dictionary_updated_at
BEFORE UPDATE ON public.robot_model_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();