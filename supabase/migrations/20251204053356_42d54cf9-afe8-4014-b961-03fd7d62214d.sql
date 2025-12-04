-- Drop the partially created type if it exists
DROP TYPE IF EXISTS robot_status_new;

-- Create new enum type without old values
CREATE TYPE robot_status_new AS ENUM ('delivered', 'in_service', 'active', 'decommissioned', 'try_and_buy');

-- Drop the default temporarily
ALTER TABLE robots ALTER COLUMN status DROP DEFAULT;

-- Update the column to use the new type
ALTER TABLE robots 
  ALTER COLUMN status TYPE robot_status_new 
  USING status::text::robot_status_new;

-- Drop the old type
DROP TYPE robot_status;

-- Rename new type to original name
ALTER TYPE robot_status_new RENAME TO robot_status;

-- Set a new default
ALTER TABLE robots ALTER COLUMN status SET DEFAULT 'active'::robot_status;