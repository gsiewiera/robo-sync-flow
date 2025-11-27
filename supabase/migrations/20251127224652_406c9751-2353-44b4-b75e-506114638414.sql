-- Create client categories table
CREATE TABLE public.client_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client tags table
CREATE TABLE public.client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#10b981',
  category_id UUID REFERENCES public.client_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table for clients and tags
CREATE TABLE public.client_assigned_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.client_tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.client_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assigned_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_categories
CREATE POLICY "All authenticated users can view categories"
  ON public.client_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage categories"
  ON public.client_categories
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for client_tags
CREATE POLICY "All authenticated users can view tags"
  ON public.client_tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage tags"
  ON public.client_tags
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for client_assigned_tags
CREATE POLICY "Users can view client tags"
  ON public.client_assigned_tags
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage their client tags"
  ON public.client_assigned_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = client_assigned_tags.client_id
      AND (
        clients.assigned_salesperson_id = auth.uid()
        OR has_role(auth.uid(), 'manager'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Add updated_at trigger for categories
CREATE TRIGGER update_client_categories_updated_at
  BEFORE UPDATE ON public.client_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for tags
CREATE TRIGGER update_client_tags_updated_at
  BEFORE UPDATE ON public.client_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.client_categories (name, color) VALUES
  ('Enterprise', '#8b5cf6'),
  ('SMB', '#3b82f6'),
  ('Startup', '#10b981'),
  ('Partner', '#f59e0b');

-- Insert some default tags
INSERT INTO public.client_tags (name, color, category_id) VALUES
  ('High Priority', '#ef4444', NULL),
  ('VIP', '#f59e0b', NULL),
  ('Active', '#10b981', NULL),
  ('Prospect', '#6366f1', NULL),
  ('On Hold', '#6b7280', NULL);