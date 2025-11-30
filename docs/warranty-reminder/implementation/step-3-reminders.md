# Step 3: Email Reminder System

**Time Estimate**: 4-5 hours  
**Dependencies**: Steps 1-2 (Database, Calculations)  
**Risk Level**: Medium (email delivery)

## Objective
Implement automated email reminders with one-click scheduling links.

## Implementation

### 1. Create Email Template
Create `lib/email-templates/service-reminder.ts`:

```typescript
import { WarrantyHelper } from '../warranty-helper'

interface ReminderEmailData {
  customerName: string
  machineName: string
  serialNumber: string
  daysUntilService: number
  healthScore: number
  totalSavings: number
  scheduleUrl: string
}

export function generateServiceReminderHTML(data: ReminderEmailData): string {
  const urgency = WarrantyHelper.getUrgencyLevel(data.daysUntilService)
  
  const urgencyColor = {
    'OVERDUE': '#dc2626',
    'URGENT': '#f59e0b', 
    'SOON': '#3b82f6',
    'UPCOMING': '#10b981'
  }[urgency]
  
  const healthColor = data.healthScore >= 80 ? '#10b981' : 
                      data.healthScore >= 60 ? '#f59e0b' : '#dc2626'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: #1a5f7a; color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Service Reminder</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">Keep your equipment running smoothly</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 24px; font-size: 16px;">Hello ${data.customerName},</p>
      
      <!-- Machine Info -->
      <div style="background: #f9fafb; border-left: 4px solid ${urgencyColor}; padding: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; font-size: 18px;">${data.machineName}</h2>
        <p style="margin: 0 0 8px; color: #6b7280;">Serial: ${data.serialNumber}</p>
        <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${urgencyColor};">
          ${data.daysUntilService > 0 
            ? `Service due in ${data.daysUntilService} days`
            : data.daysUntilService === 0
            ? 'Service due today'
            : `Service ${Math.abs(data.daysUntilService)} days overdue`}
        </p>
      </div>
      
      <!-- Metrics -->
      <div style="display: flex; gap: 16px; margin-bottom: 32px;">
        <div style="flex: 1; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Health Score</div>
          <div style="font-size: 32px; font-weight: bold; color: ${healthColor};">
            ${Math.round(data.healthScore)}/100
          </div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Total Savings</div>
          <div style="font-size: 32px; font-weight: bold; color: #10b981;">
            ₹${data.totalSavings.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
      
      ${urgency === 'OVERDUE' ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #dc2626;">
          <strong>⚠️ Important:</strong> Delaying service may affect your warranty coverage and increase breakdown risk.
        </p>
      </div>
      ` : ''}
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.scheduleUrl}" style="
          display: inline-block;
          background: #1a5f7a;
          color: white;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 16px;
        ">Schedule Service Now</a>
      </div>
      
      <p style="margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        This link will expire in 7 days. For assistance, call <strong>1800 202 0051</strong> or email <strong>customer.support@jket.in</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `
}
```

### 2. Create Reminder Service
Create `lib/services/reminder.service.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { WarrantyHelper } from '../warranty-helper'
import { generateServiceReminderHTML } from '../email-templates/service-reminder'
import { transporter, emailConfig } from '@/lib/email/config'
import jwt from 'jsonwebtoken'
import { differenceInDays } from 'date-fns'

export class ReminderService {
  /**
   * Process all machines and send reminders where needed
   */
  static async processReminders(): Promise<number> {
    let sentCount = 0
    
    try {
      // Get all machines with active warranties
      const machines = await prisma.machine.findMany({
        where: {
          sale: {
            isNot: null,
            reminderOptOut: false,
            customerEmail: { not: null }
          }
        },
        include: {
          sale: true,
          machineModel: true,
          serviceRequests: {
            include: { serviceVisit: true }
          }
        }
      })
      
      for (const machine of machines) {
        // Check if warranty is still active
        if (!WarrantyHelper.isWarrantyActive(machine)) {
          continue
        }
        
        // Check last reminder sent
        const lastReminder = await prisma.actionLog.findFirst({
          where: {
            machineId: machine.id,
            actionType: 'REMINDER_SENT'
          },
          orderBy: { createdAt: 'desc' }
        })
        
        // Check if we should send today
        if (!WarrantyHelper.shouldSendReminder(machine, lastReminder?.createdAt)) {
          continue
        }
        
        // Send reminder
        const sent = await this.sendReminder(machine)
        if (sent) sentCount++
      }
      
      console.log(`✅ Sent ${sentCount} reminders`)
    } catch (error) {
      console.error('Error processing reminders:', error)
    }
    
    return sentCount
  }
  
  /**
   * Send reminder email for a specific machine
   */
  static async sendReminder(machine: any): Promise<boolean> {
    try {
      const nextServiceDue = WarrantyHelper.getNextServiceDue(machine)
      if (!nextServiceDue) return false
      
      const daysUntilService = differenceInDays(nextServiceDue, new Date())
      const healthScore = WarrantyHelper.getHealthScore(machine)
      const totalSavings = WarrantyHelper.getTotalSavings(machine)
      
      // Generate JWT token for scheduling link
      const token = jwt.sign(
        {
          machineId: machine.id,
          serialNumber: machine.serialNumber,
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        },
        process.env.JWT_SECRET || 'your-secret-key'
      )
      
      const scheduleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/machines/${machine.serialNumber}/schedule-warranty?token=${token}`
      
      // Generate email HTML
      const html = generateServiceReminderHTML({
        customerName: machine.sale.customerName,
        machineName: machine.machineModel.name,
        serialNumber: machine.serialNumber,
        daysUntilService,
        healthScore,
        totalSavings,
        scheduleUrl
      })
      
      // Determine subject based on urgency
      const urgency = WarrantyHelper.getUrgencyLevel(daysUntilService)
      const subject = {
        'OVERDUE': `⚠️ Overdue: Service Required - ${machine.machineModel.name}`,
        'URGENT': `🔴 Urgent: Service Due Soon - ${machine.machineModel.name}`,
        'SOON': `🟡 Reminder: Service Due in ${daysUntilService} Days - ${machine.machineModel.name}`,
        'UPCOMING': `Service Reminder - ${machine.machineModel.name}`
      }[urgency]
      
      // Send email
      await transporter.sendMail({
        from: emailConfig.from,
        to: machine.sale.customerEmail,
        subject,
        html
      })
      
      // Log the reminder
      await prisma.actionLog.create({
        data: {
          machineId: machine.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL',
          metadata: {
            daysUntilService,
            healthScore,
            urgency
          }
        }
      })
      
      console.log(`📧 Sent reminder for ${machine.serialNumber}`)
      return true
      
    } catch (error) {
      console.error(`Failed to send reminder for ${machine.serialNumber}:`, error)
      return false
    }
  }
}
```

### 3. Create Cron Endpoint
Create `app/api/cron/daily-reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ReminderService } from '@/lib/services/reminder.service'

export async function GET(request: NextRequest) {
  // Verify cron secret (for Vercel Cron or similar)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    const sentCount = await ReminderService.processReminders()
    
    return NextResponse.json({
      success: true,
      remindersSent: sentCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
```

### 4. Update Environment Variables
Add to `.env`:

```env
# JWT for scheduling links
JWT_SECRET=your-random-32-character-string-here

# Cron job security
CRON_SECRET=another-random-string-for-cron-auth

# App URL (already exists, verify it's correct)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Configure Vercel Cron (Production)
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

## Testing

### 1. Test Email Sending
Create `scripts/test-reminder.ts`:

```typescript
import { ReminderService } from '@/lib/services/reminder.service'
import { prisma } from '@/lib/prisma'

async function testReminder() {
  // Get a test machine
  const machine = await prisma.machine.findFirst({
    where: {
      sale: {
        isNot: null,
        customerEmail: { not: null }
      }
    },
    include: {
      sale: true,
      machineModel: true,
      serviceRequests: {
        include: { serviceVisit: true }
      }
    }
  })
  
  if (machine) {
    console.log('Testing reminder for:', machine.serialNumber)
    const sent = await ReminderService.sendReminder(machine)
    console.log('Sent:', sent)
  } else {
    console.log('No test machine found')
  }
}

testReminder()
```

Run with: `npx tsx scripts/test-reminder.ts`

### 2. Test Cron Job Locally
```bash
# Test the endpoint directly
curl http://localhost:3000/api/cron/daily-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

### 3. Verify JWT Tokens
```typescript
// In browser console or test script
const token = "eyJ..." // Copy from email
const decoded = JSON.parse(atob(token.split('.')[1]))
console.log(decoded)
// Should show machineId, serialNumber, exp
```

## Testing Checklist

### ✅ Email Delivery
- [ ] Test email sends successfully
- [ ] HTML renders correctly in email client
- [ ] Links are clickable and valid
- [ ] Subject line matches urgency

### ✅ Reminder Logic
- [ ] Only sends on trigger days (15, 7, 3, 0, -3)
- [ ] Doesn't send duplicates same day
- [ ] Respects reminderOptOut flag
- [ ] Only for active warranties

### ✅ JWT Tokens
- [ ] Token generates correctly
- [ ] Contains required fields
- [ ] Expires after 7 days
- [ ] URL is properly formatted

### ✅ Logging
- [ ] ActionLog entries created
- [ ] Metadata stored correctly
- [ ] Can query reminder history

### ✅ Cron Job
- [ ] Endpoint responds to GET request
- [ ] Authentication works
- [ ] Processes all eligible machines
- [ ] Returns count of sent reminders

## Troubleshooting

### Emails Not Sending
1. Check SMTP credentials in `.env`
2. Verify email address is valid
3. Check spam folder
4. Review transporter logs

### Reminders Not Triggering
1. Check machine has sale with email
2. Verify warranty is active
3. Check reminderOptOut is false
4. Verify it's a trigger day

### JWT Token Issues
1. Verify JWT_SECRET is set
2. Check token hasn't expired
3. Ensure URL encoding is correct

## Success Criteria
- [x] Emails send successfully
- [x] Correct urgency and messaging
- [x] Links work and don't expire early
- [x] No duplicate sends
- [x] Cron job runs daily
- [x] Action logs created

## Next Step
With reminders working, proceed to [Step 4: Schedule UI](./step-4-scheduling.md)