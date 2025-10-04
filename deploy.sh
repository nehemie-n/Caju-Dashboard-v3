#!/bin/bash

# Caju Dashboard Deployment Script
# This script helps with common Docker deployment tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your actual configuration values"
            return 1
        else
            print_error ".env.example file not found"
            exit 1
        fi
    fi
    print_success ".env file found"
    return 0
}

# Check if private key exists
check_private_key() {
    if [ ! -f private_key.json ]; then
        print_warning "private_key.json not found. Please add your Google Earth Engine service account key."
        echo "Example content:"
        echo '{'
        echo '  "type": "service_account",'
        echo '  "project_id": "your-project",'
        echo '  "private_key_id": "...",'
        echo '  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",'
        echo '  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",'
        echo '  "client_id": "...",'
        echo '  "auth_uri": "https://accounts.google.com/o/oauth2/auth",'
        echo '  "token_uri": "https://oauth2.googleapis.com/token"'
        echo '}'
        return 1
    fi
    print_success "private_key.json found"
    return 0
}

# Production setup
prod_setup() {
    print_info "Setting up production environment..."
    
    check_docker
    check_env_file
    env_ok=$?
    check_private_key
    key_ok=$?
    
    if [ $env_ok -ne 0 ] || [ $key_ok -ne 0 ]; then
        print_error "Please fix the above issues before continuing"
        exit 1
    fi
    
    print_info "Building and starting production services..."
    docker compose up --build -d
    
    print_info "Waiting for services to start..."
    sleep 15
    
    print_info "Running initial setup..."
    docker compose exec web uv run python manage.py migrate --skip-checks
    docker compose exec web uv run python manage.py createcachetable
    docker compose exec web uv run python manage.py collectstatic --noinput
    
    print_success "Production environment is ready!"
    print_info "Application available at: http://localhost"
    print_info "To view logs: docker compose logs -f"
}

# Stop services
stop_services() {
    print_info "Stopping services..."
    docker compose down
    print_success "Services stopped"
}

# Clean up
cleanup() {
    print_info "Cleaning up Docker resources..."
    docker compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Create superuser
create_superuser() {
    print_info "Creating Django superuser..."
    docker compose exec web uv run python manage.py createsuperuser
}

# Backup database
backup_db() {
    print_info "Creating database backup..."
    if [ -z "${DASHBOARD_DB_PASSWORD}" ]; then
        print_error "DASHBOARD_DB_PASSWORD environment variable is not set."
        exit 1
    fi
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker compose exec db mysqldump -u caju_user -p"${DASHBOARD_DB_PASSWORD}" caju_dashboard > "backup_${timestamp}.sql"
    print_success "Database backup created: backup_${timestamp}.sql"
}

# Show usage
show_usage() {
    echo "Caju Dashboard Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup       Set up production environment"
    echo "  stop        Stop services"
    echo "  cleanup     Clean up all Docker resources"
    echo "  superuser   Create Django superuser"
    echo "  backup      Backup database"
    echo "  logs        Show service logs"
    echo ""
    echo "Examples:"
    echo "  $0 setup              # Set up production environment"
    echo "  $0 stop               # Stop services"
    echo "  $0 cleanup            # Clean up resources"
    echo "  $0 superuser          # Create superuser"
}

# Show logs
show_logs() {
    docker compose logs -f
}

# Main script logic
case "$1" in
    setup)
        prod_setup
        ;;
    stop)
        stop_services
        ;;
    cleanup)
        cleanup
        ;;
    superuser)
        create_superuser
        ;;
    backup)
        backup_db
        ;;
    logs)
        show_logs
        ;;
    *)
        show_usage
        exit 1
        ;;
esac