-- Create report subscriptions table
CREATE TABLE IF NOT EXISTS public.report_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('sales', 'activity', 'reseller', 'ending', 'all')),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Managers and admins can manage report subscriptions"
  ON public.report_subscriptions
  FOR ALL
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view report subscriptions"
  ON public.report_subscriptions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_report_subscriptions_updated_at
  BEFORE UPDATE ON public.report_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();