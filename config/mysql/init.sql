-- MySQL initialization script for Caju Dashboard
-- This script creates the necessary databases for different countries

-- Create all three production databases
CREATE DATABASE IF NOT EXISTS caju_dashboard;
CREATE DATABASE IF NOT EXISTS caju_dashboard_ivory;
CREATE DATABASE IF NOT EXISTS caju_dashboard_benin;

-- Grant permissions to the user for all production databases
GRANT ALL PRIVILEGES ON caju_dashboard.* TO 'caju_user'@'%';
GRANT ALL PRIVILEGES ON caju_dashboard_ivory.* TO 'caju_user'@'%';
GRANT ALL PRIVILEGES ON caju_dashboard_benin.* TO 'caju_user'@'%';

-- For development databases
CREATE DATABASE IF NOT EXISTS caju_dashboard_dev;
CREATE DATABASE IF NOT EXISTS caju_dashboard_dev_ivory;
CREATE DATABASE IF NOT EXISTS caju_dashboard_dev_benin;

GRANT ALL PRIVILEGES ON caju_dashboard_dev.* TO 'caju_user'@'%';
GRANT ALL PRIVILEGES ON caju_dashboard_dev_ivory.* TO 'caju_user'@'%';
GRANT ALL PRIVILEGES ON caju_dashboard_dev_benin.* TO 'caju_user'@'%';

FLUSH PRIVILEGES;