#!/bin/bash

# Setup script for warranty reminder cron job on VM/VPS deployment
# This configures the system cron to run the daily reminder job

set -e

echo "=================================================="
echo "  Warranty Reminder System - VM Cron Setup"
echo "=================================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script needs to be run with sudo to set up system cron"
    echo "Usage: sudo ./scripts/setup-cron-vm.sh"
    exit 1
fi

# Get the actual user who invoked sudo
ACTUAL_USER=${SUDO_USER:-$USER}
PROJECT_DIR=$(pwd)

echo "Configuration:"
echo "  User: $ACTUAL_USER"
echo "  Project Directory: $PROJECT_DIR"
echo "  Cron Schedule: Daily at 9 AM"
echo ""

# Validate project directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in current directory"
    echo "Please run this script from the project root"
    exit 1
fi

# Create the cron script that will be executed
CRON_SCRIPT="$PROJECT_DIR/scripts/cron-daily-reminders.sh"

echo "Creating cron execution script at: $CRON_SCRIPT"

cat > "$CRON_SCRIPT" << 'EOF'
#!/bin/bash

# Daily Warranty Reminder Cron Job
# This script is executed by system cron

# Change to project directory
cd "$(dirname "$0")/.."

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Log file for debugging
LOG_FILE="logs/cron-reminders.log"
mkdir -p logs

# Run the reminder job
echo "[$(date)] Starting daily reminder job..." >> "$LOG_FILE"

# Make the HTTP request to the cron endpoint with authentication
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "http://localhost:3000/api/cron/daily-reminders" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "[$(date)] Response code: $HTTP_CODE" >> "$LOG_FILE"
echo "[$(date)] Response body: $BODY" >> "$LOG_FILE"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "[$(date)] ✅ Daily reminder job completed successfully" >> "$LOG_FILE"
else
    echo "[$(date)] ❌ Daily reminder job failed with code $HTTP_CODE" >> "$LOG_FILE"
    echo "[$(date)] Error details: $BODY" >> "$LOG_FILE"
fi

echo "[$(date)] ---" >> "$LOG_FILE"
EOF

# Make the script executable
chmod +x "$CRON_SCRIPT"
chown "$ACTUAL_USER:$ACTUAL_USER" "$CRON_SCRIPT"

echo "✅ Cron script created and made executable"
echo ""

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$PROJECT_DIR/logs"

# Add cron job to the user's crontab
echo "Adding cron job to user's crontab..."

# Create temporary crontab file
TEMP_CRON=$(mktemp)

# Get existing crontab (if any)
sudo -u "$ACTUAL_USER" crontab -l 2>/dev/null > "$TEMP_CRON" || true

# Remove any existing warranty reminder cron jobs
sed -i '/cron-daily-reminders.sh/d' "$TEMP_CRON"

# Add new cron job (runs at 9 AM daily)
echo "0 9 * * * $CRON_SCRIPT" >> "$TEMP_CRON"

# Install the new crontab
sudo -u "$ACTUAL_USER" crontab "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo "✅ Cron job installed successfully"
echo ""

# Show current crontab
echo "Current crontab for user '$ACTUAL_USER':"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u "$ACTUAL_USER" crontab -l | grep -A 1 -B 1 "cron-daily-reminders.sh" || echo "(No cron jobs found)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Important notes:"
echo "  1. Make sure your Next.js app is running (npm start or pm2)"
echo "  2. Logs will be written to: logs/cron-reminders.log"
echo "  3. Test the cron manually: $CRON_SCRIPT"
echo "  4. Monitor logs: tail -f logs/cron-reminders.log"
echo ""

# Test the cron script
echo "Would you like to test the cron script now? (y/n)"
read -r RESPONSE

if [ "$RESPONSE" = "y" ] || [ "$RESPONSE" = "Y" ]; then
    echo ""
    echo "Testing cron script..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    sudo -u "$ACTUAL_USER" "$CRON_SCRIPT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Check logs/cron-reminders.log for results"
fi

echo ""
echo "Setup complete! Your warranty reminders will run daily at 9 AM."
