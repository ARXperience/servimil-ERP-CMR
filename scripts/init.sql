-- SERVIMIL OS · PostgreSQL Init Script
-- Creates extensions and initial database setup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE servimil_db TO servimil;
GRANT ALL PRIVILEGES ON SCHEMA public TO servimil;
GRANT ALL PRIVILEGES ON SCHEMA audit TO servimil;
