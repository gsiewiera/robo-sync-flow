-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'salesperson', 'technician');

-- Create enum for robot status
CREATE TYPE public.robot_status AS ENUM ('in_warehouse', 'delivered', 'in_service', 'maintenance');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');

-- Create enum for offer status
CREATE TYPE public.offer_status AS ENUM ('draft', 'sent', 'modified', 'accepted', 'rejected');

-- Create enum for contract status
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending_signature', 'active', 'expired', 'cancelled');

-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nip TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Poland',
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  assigned_salesperson_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create robots table
CREATE TABLE public.robots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  type TEXT NOT NULL,
  status robot_status DEFAULT 'in_warehouse',
  client_id UUID REFERENCES public.clients(id),
  warehouse_intake_date TIMESTAMP WITH TIME ZONE,
  purchase_date TIMESTAMP WITH TIME ZONE,
  warranty_end_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  working_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  status contract_status DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  monthly_payment DECIMAL(10, 2),
  payment_model TEXT,
  billing_schedule TEXT,
  terms TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contract_robots junction table
CREATE TABLE public.contract_robots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  robot_id UUID REFERENCES public.robots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, robot_id)
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  status offer_status DEFAULT 'draft',
  total_price DECIMAL(10, 2),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offer_items table
CREATE TABLE public.offer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  robot_model TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.profiles(id),
  client_id UUID REFERENCES public.clients(id),
  offer_id UUID REFERENCES public.offers(id),
  call_attempted BOOLEAN DEFAULT FALSE,
  call_successful BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_tickets table
CREATE TABLE public.service_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  robot_id UUID REFERENCES public.robots(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  status ticket_status DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_robots_updated_at BEFORE UPDATE ON public.robots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_tickets_updated_at BEFORE UPDATE ON public.service_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_robots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for clients
CREATE POLICY "Salespeople can view own clients" ON public.clients
  FOR SELECT USING (
    public.has_role(auth.uid(), 'salesperson') AND assigned_salesperson_id = auth.uid()
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Salespeople can insert clients" ON public.clients
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'salesperson')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Salespeople can update own clients" ON public.clients
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'salesperson') AND assigned_salesperson_id = auth.uid()
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for robots
CREATE POLICY "All authenticated users can view robots" ON public.robots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage robots" ON public.robots
  FOR ALL USING (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for contracts
CREATE POLICY "All authenticated users can view contracts" ON public.contracts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and salespeople can manage contracts" ON public.contracts
  FOR ALL USING (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'salesperson')
  );

-- RLS Policies for contract_robots
CREATE POLICY "All authenticated users can view contract_robots" ON public.contract_robots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage contract_robots" ON public.contract_robots
  FOR ALL USING (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for offers
CREATE POLICY "Salespeople can view own offers" ON public.offers
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Salespeople can manage offers" ON public.offers
  FOR ALL USING (
    public.has_role(auth.uid(), 'salesperson')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for offer_items
CREATE POLICY "Users can view offer_items" ON public.offer_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Salespeople can manage offer_items" ON public.offer_items
  FOR ALL USING (
    public.has_role(auth.uid(), 'salesperson')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (
    assigned_to = auth.uid()
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for service_tickets
CREATE POLICY "All authenticated users can view tickets" ON public.service_tickets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Technicians can manage tickets" ON public.service_tickets
  FOR ALL USING (
    public.has_role(auth.uid(), 'technician')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();