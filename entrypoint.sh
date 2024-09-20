#!/bin/bash

# Exit script in case of error
set -e

# Optional: Wait for database to be ready if your application depends on it
# Example for a PostgreSQL database:
# while ! pg_isready -h $DB_HOST -p $DB_PORT -q -U $DB_USER; do
#   echo "Waiting for PostgreSQL to become available..."
#   sleep 2
# done
# echo "PostgreSQL is available: continuing with database migrations and startup..."

# Apply Django database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start your application
echo "Starting Django application..."
exec "$@"
