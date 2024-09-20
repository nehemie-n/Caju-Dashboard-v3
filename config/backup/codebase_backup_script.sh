#!/bin/bash

CODEBASE_DIR="/home/ubuntu/DjangoApps/Caju-Dashboard-v2/Caju-Dashboard-v2"
S3_BUCKET="s3://cajudashboardprodbucket/codebase/"
BACKUP_DIR="/home/ubuntu/DjangoApps/Caju-Dashboard-v2/Dashboard_DB_BK"
RETENTION_DAYS=20
LOG_FILE="/var/log/codebase-backup.log"

# Ensure AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI not installed. Exiting." | tee -a "$LOG_FILE"
    exit 1
fi

# Function to Upload Backup
upload_backup() {
    local backup_name="codebase-backup-$(date +"%Y%m%d%H%M").tar.gz"
    echo "Starting codebase backup: $backup_name" | tee -a "$LOG_FILE"

    if tar -czf "$BACKUP_DIR/$backup_name" -C "$CODEBASE_DIR" .; then
        if aws s3 cp "$BACKUP_DIR/$backup_name" "$S3_BUCKET$backup_name"; then
            echo "Backup successfully uploaded to S3." | tee -a "$LOG_FILE"
        else
            echo "Error uploading backup to S3." | tee -a "$LOG_FILE"
            exit 1
        fi
    else
        echo "Error creating codebase backup." | tee -a "$LOG_FILE"
        exit 1
    fi

    rm "$BACKUP_DIR/$backup_name"
}

# Function to Clean Old Backups
clean_old_backups() {
    echo "Cleaning up old codebase backups..." | tee -a "$LOG_FILE"
    local current_date=$(date +%s)
    local backup_filename
    local backup_date

    aws s3 ls "$S3_BUCKET" | while read -r line; do
        backup_filename=$(echo $line | awk '{print $4}')
        backup_date=$(echo $line | awk '{print $1" "$2}')
        backup_date=$(date -d"$backup_date" +%s)

        local age=$(( (current_date - backup_date) / 86400 ))

        if [ $age -gt $RETENTION_DAYS ]; then
            echo "Deleting old backup: $backup_filename" | tee -a "$LOG_FILE"
            aws s3 rm "$S3_BUCKET$backup_filename"
        fi
    done
}

# Function to List and Select Backup File
select_backup_file() {
    echo "Fetching available codebase backups..." | tee -a "$LOG_FILE"
    local backup_list=$(aws s3 ls "$S3_BUCKET" | awk '{print $4}')
    local choice
    local selected_backup

    if [ -z "$backup_list" ]; then
        echo "No backups available. Exiting." | tee -a "$LOG_FILE"
        exit 1
    fi

    echo "Available backups:"
    local select_option=1
    local backup_options=()
    for backup in $backup_list; do
        echo "$select_option) $backup" | tee -a "$LOG_FILE"
        backup_options+=("$backup")
        select_option=$((select_option + 1))
    done

    while true; do
        read -p "Enter the number of the backup file you want to restore: " choice

        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#backup_options[@]} ]; then
            SELECTED_BACKUP=${backup_options[$((choice-1))]}
            echo "Selected backup: $SELECTED_BACKUP" | tee -a "$LOG_FILE"
            break
        else
            echo "Invalid selection. Please enter a valid number." | tee -a "$LOG_FILE"
        fi
    done
}

# Function to Restore Backup
restore_backup() {
    select_backup_file
    local selected_backup_file=$SELECTED_BACKUP
    local local_backup_path="$BACKUP_DIR/$selected_backup_file"

    echo "Restoring codebase from $selected_backup_file" | tee -a "$LOG_FILE"
    if aws s3 cp "$S3_BUCKET$selected_backup_file" "$local_backup_path"; then
        if tar -xzf "$local_backup_path" -C "$CODEBASE_DIR"; then
            echo "Codebase restoration successful." | tee -a "$LOG_FILE"
        else
            echo "Error during codebase restoration." | tee -a "$LOG_FILE"
            exit 1
        fi
    else
        echo "Error downloading backup from S3." | tee -a "$LOG_FILE"
        exit 1
    fi

    rm "$local_backup_path"
}

# Main script logic
case "$1" in
    backup)
        upload_backup
        clean_old_backups
        ;;
    restore)
        restore_backup
        ;;
    *)
        echo "Usage: $0 {backup|restore}" | tee -a "$LOG_FILE"
        exit 1
esac