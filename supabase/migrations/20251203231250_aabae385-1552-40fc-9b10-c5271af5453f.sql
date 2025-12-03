-- Create dictionary tables
CREATE TABLE public.client_type_dictionary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.market_dictionary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.segment_dictionary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create junction tables for multi-select
CREATE TABLE public.client_client_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_type_id uuid NOT NULL REFERENCES public.client_type_dictionary(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id, client_type_id)
);

CREATE TABLE public.client_markets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  market_id uuid NOT NULL REFERENCES public.market_dictionary(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id, market_id)
);

CREATE TABLE public.client_segments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES public.segment_dictionary(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id, segment_id)
);

-- Enable RLS on all tables
ALTER TABLE public.client_type_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_client_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_segments ENABLE ROW LEVEL SECURITY;

-- RLS policies for dictionary tables (read for all, manage for admins)
CREATE POLICY "All authenticated users can view client types" ON public.client_type_dictionary FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage client types" ON public.client_type_dictionary FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view markets" ON public.market_dictionary FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage markets" ON public.market_dictionary FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view segments" ON public.segment_dictionary FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage segments" ON public.segment_dictionary FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for junction tables
CREATE POLICY "Users can view client types" ON public.client_client_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Salespeople can manage client types" ON public.client_client_types FOR ALL USING (has_role(auth.uid(), 'salesperson'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view client markets" ON public.client_markets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Salespeople can manage client markets" ON public.client_markets FOR ALL USING (has_role(auth.uid(), 'salesperson'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view client segments" ON public.client_segments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Salespeople can manage client segments" ON public.client_segments FOR ALL USING (has_role(auth.uid(), 'salesperson'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Insert Client Type values
INSERT INTO public.client_type_dictionary (name) VALUES
('Gastronomy'),
('Hospitality'),
('Retail'),
('Healthcare'),
('Logistics / Industry'),
('Office / Corporate'),
('Education'),
('Distributor / Partner'),
('Other');

-- Insert Market values
INSERT INTO public.market_dictionary (name) VALUES
('Restaurants'),
('Cafes'),
('Food Courts'),
('Bars / Pubs'),
('Quick Service Restaurants (QSR)'),
('Canteens / Stołówki'),
('Hotels'),
('Hostels'),
('Resorts'),
('Conference Centers'),
('Supermarkets'),
('Shopping Malls'),
('DIY Stores'),
('Electronics Stores'),
('Furniture Stores'),
('Hospitals'),
('Clinics'),
('Senior Homes / Nursing Homes'),
('Rehabilitation Centers'),
('Warehouses'),
('Factories'),
('Fulfillment Centers'),
('Office Buildings'),
('Co-working Spaces'),
('Schools'),
('Universities');

-- Insert Segment values
INSERT INTO public.segment_dictionary (name) VALUES
('Food Delivery'),
('Drink Delivery'),
('Dish Return / Bussing'),
('Runner Support'),
('Customer Greeting'),
('Promotion / Digital Signage'),
('Queue Management'),
('Wayfinding'),
('Room Delivery'),
('Luggage Delivery'),
('Guest Greeting'),
('Restaurant Support'),
('Product Promotion'),
('Customer Attraction'),
('In-store Delivery'),
('Medical Delivery'),
('Food Delivery to Patients'),
('Linen Transport'),
('Waste Transport'),
('Document Transport'),
('Light Material Transport'),
('Tool Delivery'),
('Office Document Delivery'),
('Office Supplies Delivery'),
('Visitor Greeting'),
('Cleaning'),
('Disinfection');