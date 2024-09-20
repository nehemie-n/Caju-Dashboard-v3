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
        BACKUP_DIR="/home/ubuntu/DjangoApps/Caju-Dashboard-v2/db_backups"
        
        S3_BUCKET="cajudashboardprodbucket"
        S3_PATH="database/"
    ;;
    uat)
        GUNICORN_CONFIG_DIR="/home/ubuntu/project_dir/Caju-Dashboard-v2/config/"
        STATIC_DIR="/var/www/testcajuboard.tnslabs.org/static"
        BACKUP_DIR="/home/ubuntu/project_dir/db_backups"
        
        S3_BUCKET="cajudashboarduatbucket"
        S3_PATH="database/"
    ;;
    *)
        echo "Invalid environment in .env file"
        exit 1
    ;;
esac


backup_db(){    
    # Backup file details
    DATE=$(date +"%Y-%m-%d_%H-%M-%S")
    BACKUP_FILE="$BACKUP_DIR/$DASHBOARD_DB_NAME-$DATE.sql.gz"
    
    # Create backup
    mysqldump -u $DASHBOARD_DB_USERNAME -p$DASHBOARD_DB_PASSWORD $DASHBOARD_DB_NAME | gzip > $BACKUP_FILE
    echo "Done doing SQL Dump"

    # Upload to S3
    aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/$S3_PATH
    echo "Done uploading to S3"
    
    # Remove local backup file
    rm $BACKUP_FILE
    echo "Deleted local temp backup file"
    
}


cleanup_old_backups(){
    echo "Starting cleanup of old backups"

    # Delete S3 backups older than 200 days
    TWENTY_DAYS_AGO=$(date -d "200 days ago" +%Y-%m-%d)
    aws s3 ls s3://$S3_BUCKET/$S3_PATH | while read -r line;
    do
        createDate=$(echo $line|awk {'print $1'})
        createDate=$(date -d "$createDate" +%Y-%m-%d)
        if [[ "$createDate" < "$TWENTY_DAYS_AGO" ]]
        then
            fileName=$(echo $line|awk {'print $4'})
            if [[ $fileName != "" ]]
            then
                aws s3 rm s3://$S3_BUCKET/$S3_PATH$fileName
            fi
        fi
    done
    echo "Deleted S3 backups older than 200 days"
}


# Main script logic
case "$1" in
    backup)
        backup_db
        cleanup_old_backups
    ;;
    *)
        echo "Usage: $0 {backup}" | tee -a "$LOG_FILE"
        exit 1
esac