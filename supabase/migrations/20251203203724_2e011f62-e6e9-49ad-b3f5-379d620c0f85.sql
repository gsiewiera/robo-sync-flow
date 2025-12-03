-- Add note_id column to tasks to link tasks to notes
ALTER TABLE public.tasks ADD COLUMN note_id uuid REFERENCES public.notes(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_tasks_note_id ON public.tasks(note_id);