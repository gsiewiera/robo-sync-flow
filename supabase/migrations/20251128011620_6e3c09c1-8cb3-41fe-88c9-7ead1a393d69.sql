-- Create table for team and individual goals
CREATE TABLE public.performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  
  -- Goal details
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('revenue', 'deals_won', 'conversion_rate', 'tasks_completed', 'clients_acquired', 'average_deal_size')),
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  
  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Assignment
  is_team_goal BOOLEAN DEFAULT false,
  assigned_user_id UUID REFERENCES public.profiles(id),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Managers and admins can view all goals"
  ON public.performance_goals
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Users can view their own goals"
  ON public.performance_goals
  FOR SELECT
  USING (assigned_user_id = auth.uid());

CREATE POLICY "Admins and managers can manage goals"
  ON public.performance_goals
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager')
  );

-- Create index for better performance
CREATE INDEX idx_performance_goals_user ON public.performance_goals(assigned_user_id);
CREATE INDEX idx_performance_goals_dates ON public.performance_goals(start_date, end_date);
CREATE INDEX idx_performance_goals_status ON public.performance_goals(status);

-- Create trigger for updated_at
CREATE TRIGGER update_performance_goals_updated_at
  BEFORE UPDATE ON public.performance_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();