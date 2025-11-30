# Warranty Reminder System - Product Requirements Document

## Executive Summary
Add automated warranty service reminders to reduce missed services and improve customer retention. Everything is calculated on-the-fly - no complex state management or data migrations required.

## Core Principles
1. **Calculate, don't store** - Derive everything from existing data
2. **Use what exists** - Leverage current infrastructure and pages
3. **Minimal changes** - Add only what's absolutely necessary
4. **Incremental value** - Each step works independently

## What We're Building

### Customer Experience
1. **Automated Reminders**: Email reminders at 15, 7, 3, and 0 days before service
2. **Health Score**: Visual indicator of machine maintenance status (0-100)
3. **Cost Savings**: Show money saved through preventive maintenance
4. **Easy Scheduling**: One-click link to schedule service (no login required)
5. **Service History**: View all past services on machine page

### Business Value
- Reduce missed services by 50%
- Increase customer engagement
- Data-driven AMC conversions
- Reduced support calls

## Technical Approach

### Database Changes (Minimal)
```prisma
// Add to Sale model - customer preferences
model Sale {
  // ... existing fields ...
  whatsappNumber    String?  @default(null)
  reminderOptOut    Boolean  @default(false)
}

// New table - track what we've done
model ActionLog {
  id          String   @id @default(cuid())
  machineId   String
  actionType  String   // REMINDER_SENT, SERVICE_SCHEDULED
  channel     String   // EMAIL, WHATSAPP, WEB
  metadata    Json?
  createdAt   DateTime @default(now())
  
  @@index([machineId, actionType, createdAt])
}
```

### Calculations (No Storage)
All calculations happen in real-time using existing data:

```typescript
// Health Score = f(days since last service)
if (overdue) score = 100 - (daysOverdue * 2)
else score = 100 - (daysSinceService / 90 * 30)

// Next Service = last service date + 3 months
nextDue = addMonths(lastServiceDate || saleDate, 3)

// Total Savings = completed services * standard saving
savings = completedServices * (200000 - 15000)
```

### New Routes
```
/machines/[serialNumber]/schedule-warranty
  - Public page to schedule warranty service
  - Linked from reminder emails
  - No authentication required
  - Shows health score and next service due
```

### Email Reminders
Simple HTML emails with:
- Machine name and serial number
- Days until service (color-coded urgency)
- Current health score
- Total savings achieved
- One-click schedule button (JWT token)

## Implementation Phases

### Phase 1: Database Setup (1 day)
- Add ActionLog table
- Add preference fields to Sale
- Deploy schema changes

### Phase 2: Calculations (1 day)
- Create warranty-helper.ts
- Implement health score calculation
- Implement savings calculation
- Create health API endpoint

### Phase 3: Email Reminders (2 days)
- Create reminder cron job
- Design email template
- Implement JWT tokens
- Setup email delivery

### Phase 4: Scheduling UI (1 day)
- Create schedule-warranty page
- Add to machine page navigation
- Handle JWT validation
- Create service request

### Deployment (0.5 day)
- Configure environment variables
- Setup cron jobs
- Deploy to production
- Verify functionality

## Success Metrics

### Week 1
- [ ] Reminders sending successfully
- [ ] Health scores displaying correctly
- [ ] Schedule links working

### Month 1
- [ ] 80% email open rate
- [ ] 30% click-through rate
- [ ] 20% reduction in missed services

### Month 3
- [ ] 50% reduction in emergency repairs
- [ ] 25% increase in service compliance
- [ ] 10% AMC conversion from reminders

## Configuration

### Environment Variables
```env
# Email settings (existing)
SMTP_HOST=smtp.gmail.com
SMTP_USER=customer.support@jket.in
SMTP_PASS=xxx

# New settings
JWT_SECRET=random-32-char-string
SERVICE_INTERVAL_MONTHS=3
REMINDER_DAYS_BEFORE=15
AVG_PREVENTIVE_COST=15000
AVG_BREAKDOWN_COST=200000
```

### Cron Schedule
```
0 9 * * * - Daily reminder check (9 AM)
0 2 * * 0 - Weekly health score recalculation (Sunday 2 AM)
```

## API Endpoints

### New Endpoints (Only 3!)
```typescript
GET  /api/cron/daily-reminders     // Process reminders
POST /api/actions/log              // Log actions
GET  /api/machines/[id]/health    // Get health score
```

### Modified Endpoints
```typescript
GET /api/machines/[serialNumber]  // Add calculated fields to response
```

## Risk Mitigation

### Technical Risks
- **Email delivery**: Use existing working email system
- **Performance**: Calculations are simple math, <10ms per machine
- **Token security**: JWT with 7-day expiry, one-time use

### Business Risks
- **Low engagement**: Start with pilot group, iterate on timing
- **Support burden**: Clear documentation, FAQ in emails
- **Data accuracy**: Use existing service history as source of truth

## Out of Scope
- SMS reminders (can add later)
- Mobile app notifications
- Complex scheduling algorithms
- Automated engineer assignment
- Parts inventory integration
- Multi-language support

## Total Implementation
- **New code**: ~500 lines
- **New tables**: 1
- **Modified tables**: 1
- **Time to implement**: 5.5 days
- **Risk level**: Low

## Decision Log

### Why calculate instead of store?
- No stale data
- No complex migrations
- Easy to modify formulas
- Instant accuracy

### Why use machine page?
- Already public (QR code access)
- No authentication needed
- Familiar to customers
- Less code to write

### Why JWT tokens?
- Stateless
- Secure
- No database lookups
- Time-limited

## Next Steps
1. Review and approve PRD
2. Implement Phase 1 (Database)
3. Test with internal machines
4. Pilot with 10 customers
5. Full rollout