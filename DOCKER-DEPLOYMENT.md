# Docker Deployment Guide

Deploy the JKET application with Docker, including the warranty reminder cron system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  postgres   │  │    minio    │  │    pdf-service      │ │
│  │  :5432      │  │  :9090/:9091│  │    :3002            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   jket-app                              ││
│  │                   :3000                                 ││
│  │  ┌───────────────────────────────────────────────────┐ ││
│  │  │  node-cron scheduler (runs inside Next.js)        │ ││
│  │  │  - daily-reminders: 9 AM IST                      │ ││
│  │  │  - weekly-health-check: Sunday 2 AM IST           │ ││
│  │  └───────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## How Cron Works

The cron system uses `node-cron` which runs **inside** the Next.js process:

1. When the container starts, Next.js runs `instrumentation.ts`
2. This initializes the `cronScheduler` singleton
3. Jobs run at scheduled times within the same process
4. No external cron daemon needed

## Quick Start

### 1. Create the Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm prisma generate && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Update next.config.ts for standalone output

```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
}

export default nextConfig
```

### 3. Update docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: v3-jket
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9090:9000"
      - "9091:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 5

  pdf-service:
    image: blitzjb/pdf-service:latest
    ports:
      - "3002:3000"
    environment:
      PORT: 3000

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/v3-jket
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_SECURE: "false"
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM_NAME: "JKET Prime Care"
      CRON_SECRET: ${CRON_SECRET}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      TZ: Asia/Kolkata
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

### 4. Create .env file

```bash
# .env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CRON_SECRET=your-secure-random-string
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 5. Deploy

```bash
# Build and start all services
docker-compose up -d --build

# Run migrations (first time only)
docker-compose exec app npx prisma migrate deploy

# Check logs
docker-compose logs -f app
```

## Verifying Cron is Running

### Check startup logs

```bash
docker-compose logs app | grep -E "(cron|Scheduled|scheduler)"
```

You should see:
```
🚀 Initializing cron scheduler via instrumentation...
🔄 Initializing cron scheduler...
✅ Scheduled job: daily-reminders (0 9 * * *)
✅ Scheduled job: weekly-health-check (0 2 * * 0)
✅ Cron scheduler initialized

📅 Scheduled Jobs:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • daily-reminders
    Schedule: 0 9 * * *
    Next run: 12/2/2025, 9:00:00 AM
  • weekly-health-check
    Schedule: 0 2 * * 0
    Next run: 12/8/2025, 2:00:00 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Check cron status via API

```bash
curl http://localhost:3000/api/cron/status
```

Response:
```json
{
  "success": true,
  "jobs": [
    {
      "jobName": "daily-reminders",
      "schedule": "0 9 * * *",
      "lastRun": null,
      "lastSuccess": null,
      "totalRuns": 0,
      "totalSuccess": 0,
      "isRunning": false,
      "nextRun": "2025-12-02T03:30:00.000Z"
    }
  ]
}
```

### Manually trigger a job (for testing)

```bash
curl -X POST http://localhost:3000/api/cron/status \
  -H "Content-Type: application/json" \
  -d '{"jobName": "daily-reminders", "secret": "your-cron-secret"}'
```

## Monitoring

### View real-time logs

```bash
# All logs
docker-compose logs -f app

# Filter for cron activity
docker-compose logs -f app 2>&1 | grep -E "(cron|reminder|📧|✅|❌)"
```

### Check when cron runs

When the daily reminder job executes at 9 AM, you'll see:
```
============================================================
🔄 Running cron job: daily-reminders
   Time: 2025-12-02T03:30:00.000Z
   Run #1
============================================================
📧 Starting daily reminder processing...
Found 5 machines to check for reminders
✅ Sent 3 reminders
✅ Sent 3 warranty reminders
✅ Cron job 'daily-reminders' completed successfully
   Result: { success: true, remindersSent: 3 }
   Next run: 12/3/2025, 9:00:00 AM
============================================================
```

### Query reminder history

```bash
docker-compose exec postgres psql -U postgres -d v3-jket -c \
  "SELECT id, \"machineId\", \"actionType\", \"createdAt\"
   FROM \"ActionLog\"
   WHERE \"actionType\" = 'REMINDER_SENT'
   ORDER BY \"createdAt\" DESC
   LIMIT 10;"
```

## Timezone Configuration

The cron scheduler is configured for `Asia/Kolkata` (IST). To change:

1. Update `lib/cron/scheduler.ts`:
```typescript
{
  timezone: 'Asia/Kolkata'  // Change this
}
```

2. Update docker-compose.yml:
```yaml
environment:
  TZ: Asia/Kolkata  # Change this
```

3. Rebuild: `docker-compose up -d --build`

## Troubleshooting

### Cron not initializing?

Check if instrumentation hook is enabled in `next.config.ts`:
```typescript
experimental: {
  instrumentationHook: true,
}
```

### Jobs not running at scheduled time?

1. Check timezone:
```bash
docker-compose exec app date
```

2. Verify the schedule in logs:
```bash
docker-compose logs app | grep "Next run"
```

### Container restarting?

Check for errors:
```bash
docker-compose logs --tail=100 app
```

### Database connection issues?

Ensure postgres is healthy before app starts:
```bash
docker-compose ps
```

The `depends_on` with `condition: service_healthy` ensures proper startup order.

## Production Considerations

### 1. Use Docker secrets for sensitive data

```yaml
services:
  app:
    secrets:
      - smtp_pass
      - cron_secret

secrets:
  smtp_pass:
    file: ./secrets/smtp_pass.txt
  cron_secret:
    file: ./secrets/cron_secret.txt
```

### 2. Add health check to app service

```yaml
app:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 3. Configure logging

```yaml
app:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

### 4. Resource limits

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

## Commands Reference

```bash
# Start all services
docker-compose up -d

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Check cron status
curl http://localhost:3000/api/cron/status

# Trigger job manually
curl -X POST http://localhost:3000/api/cron/status \
  -H "Content-Type: application/json" \
  -d '{"jobName": "daily-reminders", "secret": "your-secret"}'

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Access database
docker-compose exec postgres psql -U postgres -d v3-jket

# Restart app only
docker-compose restart app

# Stop all
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```
