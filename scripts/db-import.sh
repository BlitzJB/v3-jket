#!/bin/bash
# Database Import Script for JKET
# Imports data from a SQL dump file into PostgreSQL database

set -e

IMPORT_FILE="$1"

if [ -z "$IMPORT_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz or backup_file.sql>"
    echo ""
    echo "Example:"
    echo "  $0 /opt/v3-jket/backups/jket_backup_20250130_120000.sql.gz"
    echo ""
    echo "Available backups:"
    ls -la /opt/v3-jket/backups/*.sql* 2>/dev/null || echo "  No backup files found in /opt/v3-jket/backups/"
    exit 1
fi

if [ ! -f "$IMPORT_FILE" ]; then
    echo "Error: File not found: $IMPORT_FILE"
    exit 1
fi

echo "================================================"
echo "JKET Database Import"
echo "================================================"
echo "Timestamp: $(date)"
echo "Import file: $IMPORT_FILE"
echo ""

# Check if it's a gzipped file
if [[ "$IMPORT_FILE" == *.gz ]]; then
    echo "Detected gzipped file, decompressing..."
    TEMP_FILE="/tmp/jket_import_$$.sql"
    gunzip -c "$IMPORT_FILE" > "$TEMP_FILE"
    IMPORT_FILE="$TEMP_FILE"
    CLEANUP_TEMP=true
else
    CLEANUP_TEMP=false
fi

echo ""
echo "WARNING: This will replace all existing data in the database!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Import cancelled."
    [ "$CLEANUP_TEMP" = true ] && rm -f "$TEMP_FILE"
    exit 0
fi

echo ""
echo "Importing database..."

# Import database using psql inside the container
cat "$IMPORT_FILE" | docker exec -i jket-postgres psql -U postgres -d v3-jket

# Cleanup temp file if we created one
[ "$CLEANUP_TEMP" = true ] && rm -f "$TEMP_FILE"

echo ""
echo "================================================"
echo "Import complete!"
echo "================================================"
echo ""
echo "You may want to restart the app to clear any caches:"
echo "  cd /opt/v3-jket && docker compose restart app"
