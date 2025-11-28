-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on extensions schema to postgres
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO postgres;