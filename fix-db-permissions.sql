-- Fix PostgreSQL permissions for salonpro_user
-- Run this as postgres superuser

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE salonpro TO salonpro_user;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO salonpro_user;
GRANT CREATE ON SCHEMA public TO salonpro_user;

-- Grant table permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO salonpro_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO salonpro_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO salonpro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO salonpro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO salonpro_user;

-- Make salonpro_user owner of the database (optional but recommended)
ALTER DATABASE salonpro OWNER TO salonpro_user;