# Docker Deployment Guide

Deploy the JKET application with Docker, including the warranty reminder cron system.

## Architecture

```
                           ┌──────────────────────────────────┐
                           │          Host Machine            │
                           │                                  │
                           │    Only port 3000 is exposed     │
                           └──────────────┬───────────────────┘
                                          │ :3000
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Docker Internal Network                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          app (Next.js)                              │   │
│  │                          :3000 (exposed)                            │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │  node-cron scheduler                                          │ │   │
│  │  │  - daily-reminders: 9 AM IST                                  │ │   │
│  │  │  - weekly-health-check: Sunday 2 AM IST                       │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                             │
│         ┌─────────────────────┼─────────────────────┐                      │
│         │                     │                     │                      │
│         ▼                     ▼                     ▼                      │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────┐            │
│  │  postgres   │      │    minio    │      │   pdf-service   │            │
│  │  :5432      │      │  :9000      │      │   :3000         │            │
│  │  (internal) │      │  (internal) │      │   (internal)    │            │
│  └─────────────┘      └─────────────┘      └─────────────────┘            │
│                                                                             │
│  All internal services communicate via Docker DNS:                         │
│  - postgres:5432                                                           │
│  - minio:9000                                                              │
│  - pdf-service:3000                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Security Benefits

- **Only port 3000 is exposed** - The Next.js app is the only entry point
- **Internal services are isolated** - PostgreSQL, MinIO, and PDF service are not accessible from outside
- **Service-to-service communication** uses Docker's internal DNS (e.g., `postgres:5432`)
- **No direct database access** from outside the container network

## Quick Start

### 1. Create `.env` file

```bash
# .env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CRON_SECRET=your-secure-random-string
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Build and start all services

```bash
# Production mode (only app exposed)
docker-compose up -d --build

# Wait for services to be healthy
docker-compose ps

# Run database migrations (first time only)
docker-compose exec app npx prisma migrate deploy
```

### 3. Verify everything is running

```bash
# Check all services
docker-compose ps

# Check cron scheduler initialized
docker-compose logs app | grep -E "(cron|Scheduled)"

# Test the app
curl http://localhost:3000
```

## Development Mode

For local development, you may want to access services directly (e.g., MinIO console, direct DB access):

```bash
# Start with exposed service ports
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

This exposes:
- `localhost:3000` - Next.js app
- `localhost:5432` - PostgreSQL (for Prisma Studio, pgAdmin, etc.)
- `localhost:9090` - MinIO API
- `localhost:9091` - MinIO Console
- `localhost:3002` - PDF Service

## How Cron Works

The cron system uses `node-cron` which runs **inside** the Next.js container:

1. When the container starts, Next.js runs `instrumentation.ts`
2. This initializes the `cronScheduler` singleton
3. Jobs run at scheduled times within the same process
4. No external cron daemon needed

### Verify Cron is Running

Check startup logs:
```bash
docker-compose logs app | grep -E "(cron|Scheduled|scheduler)"
```

Expected output:
```
🚀 Initializing cron scheduler via instrumentation...
🔄 Initializing cron scheduler...
✅ Scheduled job: daily-reminders (0 9 * * *)
✅ Scheduled job: weekly-health-check (0 2 * * 0)
✅ Cron scheduler initialized
```

### Check Cron Status via API

```bash
curl http://localhost:3000/api/cron/status
```

### Manually Trigger a Job

```bash
curl -X POST http://localhost:3000/api/cron/status \
  -H "Content-Type: application/json" \
  -d '{"jobName": "daily-reminders", "secret": "your-cron-secret"}'
```

## Internal Network Communication

### How services connect (inside Docker):

| From | To | URL |
|------|-----|-----|
| app | PostgreSQL | `postgresql://postgres:postgres@postgres:5432/v3-jket` |
| app | MinIO | `minio:9000` |
| app | PDF Service | `http://pdf-service:3000` |

### Environment Variables (set automatically in docker-compose.yml):

```yaml
# Database
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/v3-jket

# MinIO
MINIO_ENDPOINT: minio
MINIO_PORT: 9000

# PDF Service
PDF_SERVICE_URL: http://pdf-service:3000
```

## Monitoring

### View logs

```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Filter for cron activity
docker-compose logs -f app 2>&1 | grep -E "(cron|reminder|📧|✅|❌)"
```

### Check service health

```bash
# All services status
docker-compose ps

# Detailed health info
docker-compose ps --format json | jq
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

## Troubleshooting

### App can't connect to database?

```bash
# Check postgres is healthy
docker-compose ps postgres

# Check network connectivity
docker-compose exec app ping postgres

# View postgres logs
docker-compose logs postgres
```

### App can't connect to MinIO?

```bash
# Check minio is healthy
docker-compose ps minio

# Test from app container
docker-compose exec app wget -q -O- http://minio:9000/minio/health/live
```

### Cron not running?

```bash
# Check if instrumentation hook ran
docker-compose logs app | grep "instrumentation"

# Verify scheduler is initialized
docker-compose logs app | grep "Scheduled"
```

### Rebuild after code changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Or just rebuild app
docker-compose build app && docker-compose up -d app
```

## Production Considerations

### 1. Use secrets for sensitive data

```bash
# Create secrets
echo "your-smtp-password" | docker secret create smtp_pass -
echo "your-cron-secret" | docker secret create cron_secret -
```

### 2. Add resource limits

```yaml
# In docker-compose.yml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### 3. Configure logging

```yaml
app:
  logging:
    driver: "json-file"
    options:
      max-size: "50m"
      max-file: "5"
```

### 4. Health checks

```yaml
app:
  healthcheck:
    test: ["CMD", "wget", "-q", "-O-", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

## Commands Reference

```bash
# Start all services
docker-compose up -d

# Start with build
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Check status
docker-compose ps

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

# Development mode (exposed ports)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```
