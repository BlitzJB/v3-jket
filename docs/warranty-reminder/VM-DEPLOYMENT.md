# Warranty Reminder System - VM/VPS Deployment Guide

Complete guide for deploying the warranty reminder system on a Virtual Machine or VPS (not Vercel).

---

## Overview

For VM deployments, the cron job needs to be configured differently than Vercel:
- ❌ `vercel.json` cron configuration **does not work** on VMs
- ✅ Use system cron (Linux/Ubuntu) or Task Scheduler (Windows)
- ✅ Cron calls the API endpoint locally
- ✅ Next.js app must be running continuously (use PM2)

---

## Prerequisites

- VM/VPS with Ubuntu/Debian (or similar Linux distribution)
- Node.js 18+ installed
- Docker and Docker Compose installed
- PostgreSQL database (via Docker or managed service)
- Domain pointing to your VM (optional but recommended)

---

## Step 1: Deploy the Application

### 1.1 Clone and Setup

```bash
# Clone repository
cd /opt
git clone <your-repo-url> jket-app
cd jket-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
nano .env
```

### 1.2 Configure Environment Variables

Edit `.env` with production values:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/v3-jket"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"  # Or http://your-ip:3000
AUTH_SECRET="your-production-auth-secret"
AUTH_URL="https://your-domain.com"

# Warranty Reminder System
JWT_SECRET="generate-with-openssl-rand-base64-32"
CRON_SECRET="generate-with-openssl-rand-base64-32"

# SMTP Configuration (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM_NAME="JKET Prime Care"

# Service Configuration
SERVICE_INTERVAL_MONTHS="3"
REMINDER_DAYS_BEFORE="15,7,3,0,-3"
AVG_PREVENTIVE_COST="15000"
AVG_BREAKDOWN_COST="200000"
```

### 1.3 Start Database Services

```bash
# Start PostgreSQL and other services
docker-compose up -d

# Wait for services to be ready
sleep 10

# Verify services are running
docker-compose ps
```

### 1.4 Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Apply all migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

### 1.5 Build the Application

```bash
# Build for production
npm run build

# Verify build succeeded
ls -la .next/
```

---

## Step 2: Setup Process Manager (PM2)

For production, use PM2 to keep the Next.js app running continuously.

### 2.1 Install PM2

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### 2.2 Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'jket-app',
    script: 'npm',
    args: 'start',
    cwd: '/opt/jket-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
}
```

### 2.3 Start Application with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Verify app is running
pm2 status
pm2 logs jket-app
```

### 2.4 Test Application

```bash
# Test locally
curl http://localhost:3000

# Test health endpoint
curl http://localhost:3000/api/machines/test-123/health
```

---

## Step 3: Setup Cron Job for Daily Reminders

### 3.1 Automated Setup (Recommended)

Run the setup script:

```bash
# Run with sudo (required for cron setup)
sudo ./scripts/setup-cron-vm.sh
```

This will:
1. Create a cron execution script
2. Add the job to your crontab
3. Setup logging
4. Optionally test the job

### 3.2 Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 9 AM daily)
0 9 * * * /opt/jket-app/scripts/cron-daily-reminders.sh

# Verify crontab
crontab -l
```

---

## Step 4: Verify Cron Job Works

### 4.1 Test Manually

```bash
# Run the cron script manually
./scripts/cron-daily-reminders.sh

# Check the logs
tail -f logs/cron-reminders.log
```

Expected output:
```
[2025-11-12 09:00:01] Starting daily reminder job...
[2025-11-12 09:00:03] Response code: 200
[2025-11-12 09:00:03] Response body: {"success":true,"remindersSent":5}
[2025-11-12 09:00:03] ✅ Daily reminder job completed successfully
```

### 4.2 Monitor Cron Execution

```bash
# Watch cron logs in real-time
tail -f logs/cron-reminders.log

# Check last 50 lines
tail -50 logs/cron-reminders.log

# Search for errors
grep "❌" logs/cron-reminders.log
```

### 4.3 Check System Cron Logs

```bash
# Ubuntu/Debian
grep CRON /var/log/syslog | tail -20

# Or check cron-specific logs
tail -f /var/log/cron
```

---

## Step 5: Setup Nginx Reverse Proxy (Optional but Recommended)

### 5.1 Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 5.2 Configure Nginx

Create `/etc/nginx/sites-available/jket-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/jket-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5.3 Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

---

## Monitoring and Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status

# View logs
pm2 logs jket-app

# Restart app
pm2 restart jket-app

# View app info
pm2 info jket-app
```

### Check Cron Job Status

```bash
# View cron logs
tail -f logs/cron-reminders.log

# Check last execution
tail -20 logs/cron-reminders.log | grep "Starting daily reminder job"

# Count successful executions today
grep "$(date +%Y-%m-%d)" logs/cron-reminders.log | grep "✅"
```

### Check Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d v3-jket

# Check recent reminders
SELECT * FROM "ActionLog"
WHERE "actionType" = 'REMINDER_SENT'
ORDER BY "createdAt" DESC
LIMIT 10;

# Exit
\q
```

### Monitor Email Sending

```bash
# Check application logs for email activity
pm2 logs jket-app | grep "📧"

# Check for email errors
pm2 logs jket-app --err | grep -i "email\|smtp"
```

---

## Troubleshooting

### Cron Job Not Running

**Check if cron service is running:**
```bash
sudo systemctl status cron
```

**Verify crontab:**
```bash
crontab -l | grep cron-daily-reminders
```

**Check cron logs:**
```bash
tail -100 logs/cron-reminders.log
```

**Test manually:**
```bash
./scripts/cron-daily-reminders.sh
```

---

### Application Not Accessible

**Check PM2 status:**
```bash
pm2 status
pm2 logs jket-app --lines 50
```

**Check port is listening:**
```bash
sudo netstat -tlnp | grep 3000
```

**Test locally:**
```bash
curl http://localhost:3000
```

---

### Database Connection Issues

**Check Docker containers:**
```bash
docker-compose ps
docker-compose logs postgres
```

**Test database connection:**
```bash
npx prisma db pull
```

**Restart database:**
```bash
docker-compose restart postgres
```

---

### Email Not Sending

**Check SMTP credentials:**
```bash
# Verify env vars are loaded
node -e "console.log(require('dotenv').config()); console.log(process.env.SMTP_USER)"
```

**Test email manually:**
```bash
npx tsx scripts/test-email-system.ts
```

**Check Gmail App Password:**
- Must use App Password, not regular password
- Create at: https://myaccount.google.com/apppasswords

---

## Backup and Recovery

### Backup Database

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres v3-jket > backup-$(date +%Y%m%d).sql

# Backup to remote location
scp backup-*.sql user@backup-server:/backups/
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T postgres psql -U postgres v3-jket < backup-20251112.sql
```

### Backup Environment and Config

```bash
# Backup important files
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  .env \
  ecosystem.config.js \
  docker-compose.yml
```

---

## Updates and Deployments

### Deploying Updates

```bash
# Pull latest code
cd /opt/jket-app
git pull origin main

# Install new dependencies
npm install

# Run new migrations
npx prisma migrate deploy
npx prisma generate

# Rebuild application
npm run build

# Restart with PM2
pm2 restart jket-app

# Monitor logs
pm2 logs jket-app
```

---

## Security Checklist

- [ ] Environment variables in `.env` (not committed to git)
- [ ] CRON_SECRET is set and secure
- [ ] JWT_SECRET is set and secure
- [ ] Using Gmail App Password (not regular password)
- [ ] Firewall configured (only expose necessary ports)
- [ ] SSL/HTTPS enabled (via Nginx + Let's Encrypt)
- [ ] Regular database backups scheduled
- [ ] Log files rotated (use logrotate)
- [ ] PM2 logs managed (not growing indefinitely)

---

## Quick Reference

```bash
# Application Management
pm2 status                    # Check status
pm2 restart jket-app          # Restart app
pm2 logs jket-app             # View logs
pm2 monit                     # Monitor resources

# Cron Management
./scripts/cron-daily-reminders.sh    # Test manually
tail -f logs/cron-reminders.log      # Watch logs
crontab -l                            # View crontab

# Database
docker-compose ps                     # Check services
docker-compose logs postgres          # View DB logs
npx prisma migrate status             # Check migrations

# Testing
npx tsx scripts/test-reminder-system-e2e.ts  # Run E2E tests
curl http://localhost:3000/api/cron/daily-reminders \
  -H "Authorization: Bearer $CRON_SECRET"    # Test cron endpoint
```

---

## Support

For issues specific to VM deployment:
1. Check PM2 logs: `pm2 logs jket-app`
2. Check cron logs: `tail -f logs/cron-reminders.log`
3. Check system logs: `journalctl -xe`
4. Verify services: `docker-compose ps`

---

**VM Deployment Status**: Ready for production ✅
