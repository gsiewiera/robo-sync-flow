-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  client_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create campaign_clients junction table
CREATE TABLE public.campaign_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, client_id)
);

-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create campaign_mailings table
CREATE TABLE public.campaign_mailings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.email_templates(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID REFERENCES public.profiles(id)
);

-- Create campaign_mailing_logs table
CREATE TABLE public.campaign_mailing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mailing_id UUID NOT NULL REFERENCES public.campaign_mailings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error TEXT
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_mailings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_mailing_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaigns
CREATE POLICY "Users can view campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage campaigns" ON public.campaigns
  FOR ALL USING (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS policies for campaign_clients
CREATE POLICY "Users can view campaign_clients" ON public.campaign_clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage campaign_clients" ON public.campaign_clients
  FOR ALL USING (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS policies for email_templates
CREATE POLICY "Users can view email_templates" ON public.email_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage email_templates" ON public.email_templates
  FOR ALL USING (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS policies for campaign_mailings
CREATE POLICY "Users can view campaign_mailings" ON public.campaign_mailings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage campaign_mailings" ON public.campaign_mailings
  FOR ALL USING (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS policies for campaign_mailing_logs
CREATE POLICY "Users can view campaign_mailing_logs" ON public.campaign_mailing_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage campaign_mailing_logs" ON public.campaign_mailing_logs
  FOR ALL USING (
    has_role(auth.uid(), 'salesperson'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Add triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();