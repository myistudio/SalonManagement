-- Create database and user if they don't exist
CREATE DATABASE salon_db;
CREATE USER salon_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE salon_db TO salon_user;

-- Connect to the salon_db
\c salon_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO salon_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO salon_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO salon_user;