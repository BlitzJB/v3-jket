# 🚀 VM Deployment Quick Start

Quick guide for deploying the warranty reminder system on a Virtual Machine.

---

## ⚠️ Important: Vercel vs VM Deployment

| Feature | Vercel | VM/VPS |
|---------|--------|--------|
| Cron Jobs | ✅ `vercel.json` | ❌ Needs system cron |
| Auto-scaling | ✅ Automatic | ❌ Manual setup |
| Process Management | ✅ Built-in | ❌ Need PM2 |
| SSL | ✅ Automatic | ❌ Manual (Nginx + Let's Encrypt) |

**Bottom Line**: The `vercel.json` cron configuration **does NOT work** on VMs. You need to set up system cron.

---

## 📋 Prerequisites

```bash
# Ubuntu/Debian VM with:
- Node.js 18+
- Docker & Docker Compose
- Git
```

---

## 🚀 Quick Setup (5 Steps)

### 1️⃣ Deploy Application

```bash
# Clone and setup
cd /opt
git clone <your-repo> jket-app
cd jket-app
npm install

# Configure environment
cp .env.example .env
nano .env  # Add your SMTP credentials, secrets, etc.

# Start services
docker-compose up -d

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Build
npm run build
```

### 2️⃣ Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start app with PM2
pm2 start npm --name "jket-app" -- start

# Save configuration
pm2 save
pm2 startup  # Follow the instructions shown
```

### 3️⃣ Setup Cron Job (Automatic)

```bash
# Run the automated setup script
sudo ./scripts/setup-cron-vm.sh
```

**This will:**
- ✅ Create cron execution script
- ✅ Add to your crontab (runs at 9 AM daily)
- ✅ Setup logging to `logs/cron-reminders.log`
- ✅ Test the job (optional)

### 4️⃣ Verify Everything Works

```bash
# Check PM2 is running
pm2 status

# Test cron manually
./scripts/cron-daily-reminders.sh

# Check logs
tail -f logs/cron-reminders.log
```

### 5️⃣ Setup Nginx + SSL (Optional)

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx proxy to port 3000
# (See full guide in VM-DEPLOYMENT.md)

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

## ✅ Verification Checklist

```bash
# 1. Check app is running
pm2 status
curl http://localhost:3000

# 2. Check database
docker-compose ps | grep postgres

# 3. Check crontab
crontab -l | grep cron-daily-reminders

# 4. Test cron manually
./scripts/cron-daily-reminders.sh

# 5. Check logs
tail -20 logs/cron-reminders.log
```

---

## 📊 How It Works on VM

```
┌─────────────────────────────────────────┐
│  System Cron (9 AM Daily)               │
│  0 9 * * * /path/to/cron-script.sh     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  cron-daily-reminders.sh                │
│  - Loads .env variables                 │
│  - Calls HTTP endpoint with auth        │
│  - Logs results                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Next.js App (PM2)                      │
│  http://localhost:3000                  │
│  /api/cron/daily-reminders              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ReminderService.processReminders()     │
│  - Queries database                     │
│  - Sends emails                         │
│  - Logs actions                         │
└─────────────────────────────────────────┘
```

---

## 🔍 Monitoring

### Check Cron Job Execution

```bash
# View cron logs
tail -f logs/cron-reminders.log

# Check today's executions
grep "$(date +%Y-%m-%d)" logs/cron-reminders.log

# Count successful runs
grep "✅" logs/cron-reminders.log | wc -l
```

### Check Application

```bash
# PM2 status
pm2 status
pm2 logs jket-app

# Test endpoint
curl http://localhost:3000/api/cron/daily-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Check Database

```bash
# Recent reminders sent
docker-compose exec postgres psql -U postgres -d v3-jket -c \
  "SELECT * FROM \"ActionLog\" WHERE \"actionType\" = 'REMINDER_SENT' ORDER BY \"createdAt\" DESC LIMIT 10;"
```

---

## 🆘 Troubleshooting

### Cron Not Running?

```bash
# Is cron service running?
sudo systemctl status cron

# Is job in crontab?
crontab -l

# Test manually
./scripts/cron-daily-reminders.sh

# Check system cron logs
grep CRON /var/log/syslog | tail -20
```

### App Not Responding?

```bash
# Check PM2
pm2 status
pm2 restart jket-app

# Check port
sudo netstat -tlnp | grep 3000

# Check logs
pm2 logs jket-app --lines 50
```

### Emails Not Sending?

```bash
# Test email system
npx tsx scripts/test-email-system.ts

# Check SMTP credentials in .env
cat .env | grep SMTP

# For Gmail, use App Password:
# https://myaccount.google.com/apppasswords
```

---

## 📁 Important Files

```
/opt/jket-app/
├── scripts/
│   ├── setup-cron-vm.sh           # Setup script (run once)
│   └── cron-daily-reminders.sh    # Cron execution script
├── logs/
│   └── cron-reminders.log         # Cron execution logs
├── .env                            # Environment configuration
└── ecosystem.config.js             # PM2 configuration
```

---

## 🔄 Daily Operations

### Update Application

```bash
cd /opt/jket-app
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart jket-app
```

### Check Logs

```bash
# Application logs
pm2 logs jket-app

# Cron logs
tail -f logs/cron-reminders.log

# Database logs
docker-compose logs postgres
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres v3-jket > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-*.sql
```

---

## 🎯 Key Differences from Vercel

| Aspect | Vercel | VM Deployment |
|--------|--------|---------------|
| **Cron Setup** | `vercel.json` | System cron + script |
| **Process** | Serverless | PM2 managed |
| **Endpoint Call** | Internal | HTTP (localhost) |
| **Logs** | Vercel dashboard | `logs/cron-reminders.log` |
| **SSL** | Automatic | Nginx + Let's Encrypt |
| **Restart** | Automatic | Manual (PM2) |

---

## ✨ Benefits of VM Deployment

- ✅ Full control over infrastructure
- ✅ No cold starts
- ✅ Persistent processes
- ✅ Better for databases on same machine
- ✅ Cost-effective for always-on services

---

## 📚 Full Documentation

- **Complete Guide**: `docs/warranty-reminder/VM-DEPLOYMENT.md`
- **Testing Guide**: `docs/warranty-reminder/TESTING.md`
- **PRD**: `docs/warranty-reminder/PRD.md`

---

## 🎉 You're Done!

After setup, your warranty reminder system will:
- ✅ Run daily at 9 AM automatically
- ✅ Send reminder emails to customers
- ✅ Log all activity
- ✅ Work reliably on your VM

**Monitor first execution:**
```bash
# Watch logs starting at 8:59 AM
tail -f logs/cron-reminders.log
```

---

**Questions?** Check the full VM deployment guide: `docs/warranty-reminder/VM-DEPLOYMENT.md`
