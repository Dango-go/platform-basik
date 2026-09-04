-- Automatic Database & User Initialization Script for IDP Platform

-- Create admin user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin'
   ) THEN
      CREATE ROLE admin WITH LOGIN PASSWORD 'auth';
   END IF;
END
$do$;

-- Grant superuser/createdb privileges to admin for platform management
ALTER USER admin WITH SUPERUSER CREATEDB REPLICATION;

-- Create individual service databases if not exists
CREATE DATABASE idp_authentication OWNER admin;
CREATE DATABASE idp_users OWNER admin;
CREATE DATABASE vault_storage OWNER admin;
CREATE DATABASE provisioning_db OWNER admin;
CREATE DATABASE orders_db OWNER admin;

GRANT ALL PRIVILEGES ON DATABASE idp_platform TO "bohdan-root";
GRANT ALL PRIVILEGES ON DATABASE idp_authentication TO admin;
GRANT ALL PRIVILEGES ON DATABASE idp_users TO admin;
GRANT ALL PRIVILEGES ON DATABASE vault_storage TO admin;
GRANT ALL PRIVILEGES ON DATABASE provisioning_db TO admin;
