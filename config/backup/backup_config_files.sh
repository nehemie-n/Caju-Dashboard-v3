#!/bin/bash

ENV_FILE_PRODUCTION="/home/ubuntu/DjangoApps/Caju-Dashboard-v2/Caju-Dashboard-v2/.env"
ENV_FILE_UAT="/home/ubuntu/project_dir/Caju-Dashboard-v2/.env"

if [ -f "$ENV_FILE_PRODUCTION" ]; then
    source "$ENV_FILE_PRODUCTION"
elif [ -f "$ENV_FILE_UAT" ]; then
    source "$ENV_FILE_UAT"
else
    echo "No .env file found in either location."
    exit 1
fi

case "$DJANGO_ENV" in
    production)
        GUNICORN_CONFIG_DIR="/home/ubuntu/DjangoApps/Caju-Dashboard-v2/Caju-Dashboard-v2/config/"
        STATIC_DIR="/var/www/cajuboard.tnslabs.org/static"
        BACKUP_DIR="/home/ubuntu/DjangoApps/Caju-Dashboard-v2/backup_files"
        ;;
    uat)
        GUNICORN_CONFIG_DIR="/home/ubuntu/project_dir/Caju-Dashboard-v2/config/"
        STATIC_DIR="/var/www/testcajuboard.tnslabs.org/static"
        BACKUP_DIR="/home/ubuntu/project_dir/backup_files"
        ;;
    *)
        echo "Invalid environment in .env file"
        exit 1
        ;;
esac

NGINX_CONFIG_FILE="/etc/nginx/sites-available/cajuboard"
MONIT_CONFIG_FILE="/etc/monitrc"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
fi

echo "Copying nginx site configuration..."
cp "$NGINX_CONFIG_FILE" "$BACKUP_DIR"

echo "Copying the entire app config directory..."
cp -r "$GUNICORN_CONFIG_DIR" "$BACKUP_DIR"

echo "Copying monit config..."
sudo cp "$MONIT_CONFIG_FILE" "$BACKUP_DIR"

echo "Copying static web content..."
cp -r "$STATIC_DIR" "$BACKUP_DIR"

echo "Backup completed successfully."