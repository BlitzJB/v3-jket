#!/bin/bash
# Database Export Script for JKET
# Exports all data from PostgreSQL database to a SQL dump file

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_DIR="/opt/v3-jket/backups"
EXPORT_FILE="${EXPORT_DIR}/jket_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$EXPORT_DIR"

echo "================================================"
echo "JKET Database Export"
echo "================================================"
echo "Timestamp: $(date)"
echo "Export file: $EXPORT_FILE"
echo ""

# Export database using pg_dump inside the container
echo "Exporting database..."
docker exec jket-postgres pg_dump -U postgres -d v3-jket --clean --if-exists --no-owner --no-acl > "$EXPORT_FILE"

# Compress the export
echo "Compressing export..."
gzip -f "$EXPORT_FILE"
EXPORT_FILE="${EXPORT_FILE}.gz"

# Show file size
FILE_SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
echo ""
echo "================================================"
echo "Export complete!"
echo "File: $EXPORT_FILE"
echo "Size: $FILE_SIZE"
echo "================================================"
echo ""
echo "To transfer to another server, use:"
echo "  scp $EXPORT_FILE user@newserver:/opt/v3-jket/backups/"
