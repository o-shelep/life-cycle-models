#!/usr/bin/env bash
# Daily MySQL backup with 14-day retention (NFR-4).
# Cron (03:00 UTC):  0 3 * * * BACKUP_DIR=/var/backups/books_manager /path/to/scripts/backup-db.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-books_manager}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/${DB_NAME}_$(date -u +%Y-%m-%d_%H%M).sql.gz"

mysqldump --single-transaction --routines \
  -h "${DB_HOST:-localhost}" -P "${DB_PORT:-3306}" -u "${DB_USER:-root}" ${DB_PASSWORD:+-p"$DB_PASSWORD"} \
  "$DB_NAME" | gzip > "$file"

find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
echo "Backup saved to $file"
