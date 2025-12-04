-- Create table for text-based system settings (like number masks)
CREATE TABLE public.system_text_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_text_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "All authenticated users can view text settings"
  ON public.system_text_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage text settings"
  ON public.system_text_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default contract number mask
-- {YYYY} = year, {NNN} = sequential number padded to 3 digits
INSERT INTO public.system_text_settings (setting_key, setting_value, description)
VALUES ('contract_number_mask', 'CNT-{YYYY}-{NNN}', 'Contract number format. Use {YYYY} for year, {NNN} for sequential number');