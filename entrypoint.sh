#!/bin/bash

# Exit script in case of error
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z $DB_HOST $DB_PORT; do
  echo "Waiting for database connection..."
  sleep 2
done
echo "Database is available: continuing with setup..."

# Wait for RabbitMQ to be ready
echo "Waiting for RabbitMQ to be ready..."
while ! nc -z $RABBITMQ_HOST $RABBITMQ_PORT; do
  echo "Waiting for RabbitMQ connection..."
  sleep 2
done
echo "RabbitMQ is available: continuing with setup..."

# Initialize spatial metadata for SQLite if needed
if [ "$DJANGO_ENV" = "test" ] || [ "$TESTING" = "True" ]; then
    echo "Setting up test database with spatial metadata..."
    uv run python manage.py shell -c "import django;django.db.connection.cursor().execute('SELECT InitSpatialMetaData(1);')" || true
fi

# Apply Django database migrations
echo "Applying database migrations..."
uv run python manage.py migrate --skip-checks

# Create cache table
echo "Creating cache table..."
uv run python manage.py createcachetable || true

# Run setup if not in test mode
if [ "$DJANGO_ENV" != "test" ] && [ "$TESTING" != "True" ]; then
    echo "Running setup..."
    make setup || echo "Setup completed with warnings"
fi

# Collect static files
echo "Collecting static files..."
uv run python manage.py collectstatic --noinput

# Start your application based on the command argument
case "$1" in
    web)
        echo "Starting Django web application with Gunicorn..."
        exec uv run gunicorn -c config/gunicorn/prod.py -k uvicorn.workers.UvicornWorker cajulab_remote_sensing_dashboard.asgi:application
        ;;
    celery)
        echo "Starting Celery worker..."
        exec uv run celery -A cajulab_remote_sensing_dashboard worker --loglevel=info
        ;;
    celery-beat)
        echo "Starting Celery beat..."
        exec uv run celery -A cajulab_remote_sensing_dashboard beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
        ;;
    *)
        echo "Starting with custom command: $@"
        exec "$@"
        ;;
esac