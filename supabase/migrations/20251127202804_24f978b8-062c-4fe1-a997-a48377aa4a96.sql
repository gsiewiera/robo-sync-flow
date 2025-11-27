-- Add new fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES offers(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS meeting_type text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS person_to_meet text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS meeting_date_time timestamp with time zone;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS place text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_date_time timestamp with time zone;

-- Create meeting type dictionary table
CREATE TABLE IF NOT EXISTS meeting_type_dictionary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on meeting_type_dictionary
ALTER TABLE meeting_type_dictionary ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing meeting types
CREATE POLICY "All authenticated users can view meeting types"
ON meeting_type_dictionary
FOR SELECT
USING (true);

-- Create policy for managing meeting types (admins only)
CREATE POLICY "Admins can manage meeting types"
ON meeting_type_dictionary
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert some default meeting types
INSERT INTO meeting_type_dictionary (type_name) VALUES
  ('Initial consultation'),
  ('Product demonstration'),
  ('Contract discussion'),
  ('Technical review'),
  ('Follow-up meeting'),
  ('Site inspection')
ON CONFLICT DO NOTHING;