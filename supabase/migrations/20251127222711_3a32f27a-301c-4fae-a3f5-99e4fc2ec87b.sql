-- Create contract templates table
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('purchase', 'lease')),
  template_content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(contract_type, template_name)
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view templates
CREATE POLICY "All authenticated users can view templates"
ON public.contract_templates
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage templates"
ON public.contract_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to ensure only one active template per type
CREATE OR REPLACE FUNCTION public.ensure_single_active_template()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If setting this template to active, deactivate all others of same type
  IF NEW.is_active = true THEN
    UPDATE public.contract_templates
    SET is_active = false
    WHERE contract_type = NEW.contract_type
      AND id != NEW.id
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for ensuring single active template
CREATE TRIGGER ensure_single_active_template_trigger
BEFORE INSERT OR UPDATE OF is_active ON public.contract_templates
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.ensure_single_active_template();