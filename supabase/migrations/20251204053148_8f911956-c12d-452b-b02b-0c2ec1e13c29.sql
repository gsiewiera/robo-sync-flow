-- Add new enum values
ALTER TYPE robot_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE robot_status ADD VALUE IF NOT EXISTS 'decommissioned';
ALTER TYPE robot_status ADD VALUE IF NOT EXISTS 'try_and_buy';