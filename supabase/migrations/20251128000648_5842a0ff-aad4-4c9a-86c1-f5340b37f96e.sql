-- Add foreign key constraint to link offer version generators to profiles

ALTER TABLE public.offer_versions
ADD CONSTRAINT offer_versions_generated_by_fkey 
FOREIGN KEY (generated_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;