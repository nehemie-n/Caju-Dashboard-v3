# Caju Dashboard - Docker Deployment Guide

This guide explains how to deploy the Caju Dashboard application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10.0 or later
- Docker Compose 2.0.0 or later
- At least 4GB of RAM available for Docker
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/TechnoServe/Caju-Dashboard-v3.git
cd Caju-Dashboard-v3
```

### 2. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual configuration values, especially:
- `SECRET_KEY`: Generate a secure secret key
- Database passwords
- Email configuration
- External API credentials (Alteia, Google Earth Engine)

### 3. Set Up Google Earth Engine Private Key

Create a `private_key.json` file in the project root with your Google Earth Engine service account credentials.

### 4. Start the Application

Start the application using the deployment script:

```bash
./deploy.sh setup
```

Or manually:

```bash
docker compose up --build -d
```

The application will be available at:
- Web application: http://localhost:8000
- RabbitMQ Management: http://localhost:15672 (user/password@12Xa)
- Nginx (if enabled): http://localhost (port 80)

## Services Overview

The Docker Compose setup includes the following services:

### Core Services
- **web**: Django application server (Gunicorn + Uvicorn)
- **db**: MySQL 8.0 database with spatial support
- **rabbitmq**: RabbitMQ message broker for Celery
- **redis**: Redis for caching and sessions
- **nginx**: Reverse proxy and static file server

### Background Services
- **celery**: Celery worker for background tasks
- **celery-beat**: Celery beat scheduler for periodic tasks

## Configuration

### Environment Variables

Key environment variables you need to configure:

#### Django Configuration
```env
DJANGO_ENV=production
SECRET_KEY=your-very-secure-secret-key
DEBUG=False
SERVER_URL=https://your-domain.com
```

#### Database Configuration
```env
DASHBOARD_DB_NAME=caju_dashboard
DASHBOARD_DB_USERNAME=caju_user
DASHBOARD_DB_PASSWORD=secure_password
```

#### External APIs
```env
ALTEIA_USER=your_alteia_user
ALTEIA_PASSWORD=your_alteia_password
EE_SERVICE_ACCOUNT=your-service-account@project.iam.gserviceaccount.com
```

### Database Setup

The MySQL service automatically creates the required databases:
- `caju_dashboard` (main database)
- `caju_dashboard_ivory` (Ivory Coast data)
- `caju_dashboard_benin` (Benin data)

### SSL Configuration

To enable HTTPS:

1. Place your SSL certificates in `config/ssl/`:
   - `cert.pem` (certificate)
   - `key.pem` (private key)

2. Uncomment the SSL server block in `config/nginx/nginx.conf`

3. Update your domain name in the configuration

## Management Commands

### Running Django Commands

```bash
# Using the deployment script
./deploy.sh superuser
./deploy.sh backup
./deploy.sh logs

# Or manually
# Run migrations
docker compose exec web uv run python manage.py migrate

# Create superuser
docker compose exec web uv run python manage.py createsuperuser

# Collect static files
docker compose exec web uv run python manage.py collectstatic

# Run custom management commands
docker compose exec web uv run python manage.py your_command
```

### Database Operations

```bash
# Access MySQL shell
docker compose exec db mysql -u caju_user -p caju_dashboard

# Create database backup
docker compose exec db mysqldump -u caju_user -p caju_dashboard > backup.sql

# Restore database backup
docker compose exec -T db mysql -u caju_user -p caju_dashboard < backup.sql
```

### Viewing Logs

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs web
docker compose logs celery

# Follow logs in real-time
docker compose logs -f web
```

## Scaling

### Horizontal Scaling

Scale specific services:

```bash
# Scale web workers
docker compose up --scale web=3 -d

# Scale Celery workers
docker compose up --scale celery=3 -d
```

### Resource Limits

Add resource limits to your docker-compose.yml:

```yaml
services:
  web:
    # ... other configuration
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## Monitoring

### Health Checks

All services include health checks. Check service status:

```bash
docker compose ps
```

### Performance Monitoring

- RabbitMQ Management UI: http://localhost:15672
- Application logs: `docker compose logs`
- System resources: `docker stats`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database service
   docker compose logs db
   
   # Verify database is ready
   docker compose exec db mysqladmin ping -h localhost
   ```

2. **Static Files Not Loading**
   ```bash
   # Rebuild with no cache
   docker compose build --no-cache web
   
   # Collect static files
   docker compose exec web uv run python manage.py collectstatic --noinput
   ```

3. **Celery Workers Not Processing Tasks**
   ```bash
   # Check Celery logs
   docker compose logs celery
   
   # Restart Celery
   docker compose restart celery
   ```

4. **Memory Issues**
   ```bash
   # Check memory usage
   docker stats
   
   # Increase Docker memory limit in Docker Desktop
   ```

### Debug Mode

The default configuration runs in development mode with:
- Django debug mode enabled
- Detailed logging
- Direct database access on port 3306

For production, set these environment variables in your `.env`:
```env
DJANGO_ENV=production
DEBUG=False
SECRET_KEY=your-secure-production-key
```

## Production Deployment

### Cloud Deployment

1. **Build for your target platform**:
   ```bash
   docker build --platform=linux/amd64 -t caju-dashboard .
   ```

2. **Push to registry**:
   ```bash
   docker tag caju-dashboard your-registry/caju-dashboard:latest
   docker push your-registry/caju-dashboard:latest
   ```

3. **Deploy with environment-specific configuration**:
   ```bash
   # Update image in docker-compose.yml
   # Deploy to your cloud provider
   ```

### Security Considerations

- Change all default passwords
- Use strong SECRET_KEY
- Enable SSL/TLS
- Configure firewall rules
- Regular security updates
- Monitor logs for suspicious activity

### Backup Strategy

- Database: Regular MySQL dumps
- Media files: Backup media volume
- Configuration: Version control all config files

## References

- [Docker Documentation](https://docs.docker.com/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.0/howto/deployment/checklist/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)