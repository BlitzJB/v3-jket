# Warranty Reminder System - Node-Cron Deployment (Recommended)

**Much Better Than System Cron**: Runs inside your Node.js process, fully observable, and reliable.

---

## 🎯 Why Node-Cron Instead of System Cron?

| Feature | System Cron | Node-Cron (Our Solution) |
|---------|-------------|--------------------------|
| **Monitoring** | ❌ Hard to monitor | ✅ Real-time status API |
| **Logging** | ❌ Scattered logs | ✅ Centralized logs |
| **Testing** | ❌ Hard to test | ✅ Manual trigger endpoint |
| **Reliability** | ❌ Separate process | ✅ Same Node process |
| **Debugging** | ❌ Difficult | ✅ Easy with PM2 logs |
| **Setup** | ❌ Sudo required | ✅ Just start the app |
| **Observable** | ❌ No | ✅ YES! |

---

## 🚀 How It Works

```
┌────────────────────────────────────┐
│   Next.js App Starts                │
│   (npm start or PM2)                │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│   instrumentation.ts                │
│   - Runs on server startup          │
│   - Initializes cronScheduler       │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│   lib/cron/scheduler.ts             │
│   - node-cron library               │
│   - Runs inside Node process        │
│   - Daily at 9 AM: processReminders │
└──────────────┬─────────────────────┘
               │
               ▼ (Every day at 9 AM)
┌────────────────────────────────────┐
│   ReminderService.processReminders()│
│   - Query machines                  │
│   - Send emails                     │
│   - Log actions                     │
└────────────────────────────────────┘
```

---

## 📦 Installation (Already Done)

```bash
# Install node-cron (already added to package.json)
npm install node-cron

# That's it! No system configuration needed.
```

---

## 🎬 Usage

### Start the Application

```bash
# Development
npm run dev

# Production with PM2
pm2 start npm --name "jket-app" -- start
pm2 save
```

**That's it!** Cron jobs automatically start when the app starts.

---

## 📊 Monitoring (The Best Part!)

### 1. Real-Time Status API

```bash
# Get current status of all cron jobs
curl http://localhost:3000/api/cron/status
```

**Response**:
```json
{
  "success": true,
  "timestamp": "2025-11-12T18:00:00.000Z",
  "summary": {
    "totalJobs": 2,
    "totalRuns": 45,
    "totalSuccess": 44,
    "totalFailures": 1,
    "successRate": "97.78%"
  },
  "jobs": [
    {
      "jobName": "daily-reminders",
      "schedule": "0 9 * * *",
      "lastRun": "2025-11-12T09:00:00.000Z",
      "lastSuccess": "2025-11-12T09:00:03.000Z",
      "lastFailure": null,
      "lastError": null,
      "totalRuns": 45,
      "totalSuccess": 44,
      "totalFailures": 1,
      "isRunning": false,
      "nextRun": "2025-11-13T09:00:00.000Z",
      "status": "IDLE",
      "health": "HEALTHY"
    }
  ]
}
```

### 2. Manual Trigger (For Testing)

```bash
# Manually trigger a job (useful for testing)
curl -X POST http://localhost:3000/api/cron/status \
  -H "Content-Type: application/json" \
  -d '{"jobName": "daily-reminders", "secret": "YOUR_CRON_SECRET"}'
```

**Response**:
```json
{
  "success": true,
  "message": "Job 'daily-reminders' executed successfully",
  "result": {
    "success": true,
    "remindersSent": 5
  },
  "timestamp": "2025-11-12T18:30:00.000Z"
}
```

### 3. Application Logs

All cron activity is logged through your app:

```bash
# With PM2
pm2 logs jket-app

# Direct logs
npm start
```

**Sample Output**:
```
🔄 Initializing cron scheduler...
✅ Scheduled job: daily-reminders (0 9 * * *)
✅ Scheduled job: weekly-health-check (0 2 * * 0)
✅ Cron scheduler initialized

📅 Scheduled Jobs:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • daily-reminders
    Schedule: 0 9 * * *
    Next run: 11/13/2025, 9:00:00 AM
  • weekly-health-check
    Schedule: 0 2 * * 0
    Next run: 11/17/2025, 2:00:00 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[At 9:00 AM]
============================================================
🔄 Running cron job: daily-reminders
   Time: 2025-11-12T09:00:00.000Z
   Run #45
============================================================
📧 Starting daily reminder processing...
Found 3 machines to check for reminders
✅ Sent 2 reminders
✅ Cron job 'daily-reminders' completed successfully
   Result: { success: true, remindersSent: 2 }
   Next run: 11/13/2025, 9:00:00 AM
============================================================
```

---

## 🎛️ Configuration

### Cron Schedules

Edit `lib/cron/scheduler.ts` to modify schedules:

```typescript
// Daily at 9 AM IST
'0 9 * * *'

// Every hour
'0 * * * *'

// Every 30 minutes
'*/30 * * * *'

// Every Monday at 10 AM
'0 10 * * 1'

// First day of month at 8 AM
'0 8 1 * *'
```

### Timezone

Default: `Asia/Kolkata` (IST)

Change in `lib/cron/scheduler.ts`:
```typescript
{
  scheduled: true,
  timezone: 'America/New_York'  // or other timezone
}
```

---

## 🧪 Testing

### Test the Scheduler

```bash
# Start your app
npm run dev

# In another terminal, check status
curl http://localhost:3000/api/cron/status

# Manually trigger
curl -X POST http://localhost:3000/api/cron/status \
  -H "Content-Type: application/json" \
  -d '{"jobName": "daily-reminders", "secret": "'$CRON_SECRET'"}'
```

---

## 📈 Production Deployment

### With PM2 (Recommended)

```bash
# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'jket-app',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup startup script
pm2 startup

# Monitor
pm2 logs jket-app
```

### Monitor Cron Jobs

```bash
# Check status via API
curl http://localhost:3000/api/cron/status | jq

# Check PM2 logs
pm2 logs jket-app | grep "cron job"

# Monitor in real-time
pm2 logs jket-app --raw | grep "Starting daily reminder"
```

---

## 🔍 Monitoring Dashboard (Optional)

Create a simple monitoring page:

**`app/admin/cron/page.tsx`**:
```typescript
'use client'

import { useEffect, useState } from 'react'

export default function CronMonitorPage() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch('/api/cron/status')
      const data = await res.json()
      setStatus(data)
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 10000) // Refresh every 10s

    return () => clearInterval(interval)
  }, [])

  if (!status) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cron Job Monitor</h1>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold">Summary</h2>
        <p>Total Jobs: {status.summary.totalJobs}</p>
        <p>Success Rate: {status.summary.successRate}</p>
        <p>Total Runs: {status.summary.totalRuns}</p>
      </div>

      {status.jobs.map(job => (
        <div key={job.jobName} className="border p-4 rounded mb-4">
          <h3 className="font-bold">{job.jobName}</h3>
          <p>Status: {job.status}</p>
          <p>Health: {job.health}</p>
          <p>Last Run: {job.lastRun || 'Never'}</p>
          <p>Next Run: {job.nextRun}</p>
          <p>Total Success: {job.totalSuccess}</p>
          <p>Total Failures: {job.totalFailures}</p>
          {job.lastError && (
            <p className="text-red-500">Last Error: {job.lastError}</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## 🚨 Alerting (Optional)

Add Slack/Email alerts for failures:

```typescript
// In lib/cron/scheduler.ts
catch (error) {
  // Existing error handling...

  // Send alert
  if (status.totalFailures > 3) {
    await sendAlertEmail({
      subject: `Cron Job Failure: ${name}`,
      body: `Job '${name}' has failed ${status.totalFailures} times. Last error: ${status.lastError}`
    })
  }
}
```

---

## 🔄 Comparison: Old vs New

### Old Way (System Cron)
```bash
# Setup
sudo crontab -e
0 9 * * * /path/to/script.sh

# Monitor
tail -f /var/log/cron   # Hard to find
grep CRON /var/log/syslog  # Messy

# Test
# Wait until 9 AM or edit crontab 😞

# Status
# ??? No easy way
```

### New Way (Node-Cron)
```bash
# Setup
npm start  # That's it!

# Monitor
curl http://localhost:3000/api/cron/status  # Perfect!
pm2 logs jket-app  # Clear logs

# Test
curl -X POST .../api/cron/status  # Instant!

# Status
# Real-time dashboard available! 🎉
```

---

## ✅ Benefits Summary

1. **🎯 Observable**: Real-time status API
2. **📊 Monitorable**: Centralized logs via PM2
3. **🧪 Testable**: Manual trigger endpoint
4. **🔒 Reliable**: Runs in same process as app
5. **🚀 Simple**: No sudo, no system config
6. **📈 Stats**: Success rate, run count, next execution
7. **🔍 Debuggable**: Standard Node.js debugging
8. **⚡ Fast Setup**: Just start your app

---

## 🆘 Troubleshooting

### Cron Not Running?

```bash
# Check if app is running
pm2 status

# Check logs for initialization
pm2 logs jket-app | grep "Initializing cron"

# Check status
curl http://localhost:3000/api/cron/status
```

### Want to Change Schedule?

Edit `lib/cron/scheduler.ts` and restart:
```bash
pm2 restart jket-app
```

### Manual Testing

```bash
# Trigger immediately (no need to wait!)
curl -X POST http://localhost:3000/api/cron/status \
  -H "Content-Type: application/json" \
  -d '{"jobName": "daily-reminders", "secret": "'$CRON_SECRET'"}'
```

---

## 📚 Additional Resources

- **node-cron docs**: https://www.npmjs.com/package/node-cron
- **PM2 docs**: https://pm2.keymetrics.io/
- **Cron expression tester**: https://crontab.guru/

---

**Recommended Approach**: ✅ Use this Node-Cron setup for production!

It's more reliable, observable, and easier to manage than system cron.
