-- Add contract_id to tasks table
ALTER TABLE public.tasks
ADD COLUMN contract_id uuid REFERENCES public.contracts(id);

-- Create task_robots junction table for many-to-many relationship
CREATE TABLE public.task_robots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  robot_id uuid NOT NULL REFERENCES public.robots(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(task_id, robot_id)
);

-- Enable RLS on task_robots
ALTER TABLE public.task_robots ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_robots (same access as tasks)
CREATE POLICY "Users can view own task robots"
ON public.task_robots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_robots.task_id
    AND (tasks.assigned_to = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can manage own task robots"
ON public.task_robots
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_robots.task_id
    AND (tasks.assigned_to = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  )
);