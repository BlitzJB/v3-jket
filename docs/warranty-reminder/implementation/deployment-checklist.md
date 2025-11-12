# Deployment Checklist

**Time Estimate**: 1-2 hours  
**Dependencies**: Steps 1-4 completed  
**Risk Level**: Low

## Pre-Deployment

### Environment Variables
Add these to your production `.env`:

```env
# JWT for scheduling links
JWT_SECRET=generate-random-32-character-string

# Cron job security  
CRON_SECRET=another-random-string-for-cron

# App URL (verify this is correct)
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Email settings (should already exist)
SMTP_HOST=smtp.gmail.com
SMTP_USER=customer.support@jket.in
SMTP_PASS=your-app-password
```

### Database Migration
```bash
# Run migration on production
npx prisma migrate deploy
```

## Deployment Steps

### 1. Deploy to Vercel
```bash
vercel --prod
```

### 2. Configure Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 3. Manual Verification

#### Test Health Score API
```bash
curl https://your-domain.com/api/machines/[MACHINE_ID]/health
```

#### Test Scheduling Page
Navigate to:
```
https://your-domain.com/machines/[SERIAL_NUMBER]/schedule-warranty
```

#### Test Cron Endpoint (with secret)
```bash
curl https://your-domain.com/api/cron/daily-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Post-Deployment Monitoring

### Day 1
- [ ] Check cron job executed at 9 AM
- [ ] Verify ActionLog entries created
- [ ] Check email delivery
- [ ] Monitor error logs

### Week 1
- [ ] Review reminder send rate
- [ ] Check click-through rates
- [ ] Monitor service bookings
- [ ] Gather customer feedback

## Quick Rollback

If issues occur, disable the feature:

### Option 1: Disable Cron
Remove from `vercel.json` or disable in Vercel dashboard

### Option 2: Feature Flag
Add to `.env`:
```env
DISABLE_WARRANTY_REMINDERS=true
```

Then in reminder service:
```typescript
if (process.env.DISABLE_WARRANTY_REMINDERS === 'true') {
  return // Skip processing
}
```

### Option 3: Database Rollback
```sql
-- Safe to truncate, no dependencies
TRUNCATE TABLE "ActionLog";

-- If needed, remove Sale fields
ALTER TABLE "Sale" DROP COLUMN "whatsappNumber";
ALTER TABLE "Sale" DROP COLUMN "reminderOptOut";
```

## Success Indicators

✅ **Technical Success**
- Cron jobs running daily
- No error spikes
- Emails delivering

✅ **Business Success**  
- Reminders being sent
- Customers clicking links
- Services being scheduled
- Positive feedback

## Support Team Guide

### Common Questions

**Q: How do I check if a reminder was sent?**
```sql
SELECT * FROM "ActionLog" 
WHERE "machineId" = 'MACHINE_ID' 
AND "actionType" = 'REMINDER_SENT'
ORDER BY "createdAt" DESC;
```

**Q: How to manually trigger a reminder?**
```bash
POST /api/cron/daily-reminders
Authorization: Bearer CRON_SECRET
```

**Q: Customer didn't receive email?**
1. Check ActionLog for sent status
2. Verify email address in Sale record
3. Check reminderOptOut flag
4. Ask customer to check spam

**Q: How to disable reminders for a customer?**
```sql
UPDATE "Sale" 
SET "reminderOptOut" = true 
WHERE id = 'SALE_ID';
```

## Launch Communication

### Internal Team
```
Subject: Warranty Reminder System - Live

Team,

The automated warranty reminder system is now live.

What it does:
- Sends email reminders 15, 7, 3, and 0 days before service
- Shows health scores and savings
- Allows one-click scheduling

Support notes:
- Check ActionLog table for sent reminders
- Customers can opt-out via reminderOptOut flag
- Scheduling page is public (no login required)

Please monitor for any issues this week.
```

### Customer Announcement (Optional)
```
Subject: New: Automated Service Reminders

Dear Valued Customer,

We're making it easier to maintain your equipment with automated service reminders.

You'll now receive:
✅ Timely email reminders before service is due
✅ Your machine's health score
✅ Total savings from preventive maintenance
✅ One-click service scheduling

No action needed - reminders are automatically enabled.

Thank you for choosing JKET.
```

## Done! 🎉
The warranty reminder system is ready for production.