# Step 1: Database Setup

**Time Estimate**: 2-3 hours  
**Dependencies**: None  
**Risk Level**: Low

## Objective
Add minimal database changes to track reminder preferences and action history.

## Changes Required

### 1. Update Prisma Schema
Add to `prisma/schema.prisma`:

```prisma
// In the Sale model, add these fields:
model Sale {
  // ... existing fields ...
  
  // Add these new fields:
  whatsappNumber    String?   @default(null)
  reminderOptOut    Boolean   @default(false)
}

// Add this new model at the end:
model ActionLog {
  id          String   @id @default(cuid())
  machineId   String
  actionType  String   // REMINDER_SENT, SERVICE_SCHEDULED, WARRANTY_VIEWED
  channel     String   // EMAIL, WHATSAPP, WEB
  metadata    Json?    // Store any additional data
  createdAt   DateTime @default(now())
  
  // Add index for efficient queries
  @@index([machineId, actionType, createdAt])
  @@index([createdAt])
}
```

### 2. Create Migration
```bash
# Generate migration files
npx prisma migrate dev --name add_warranty_reminder_fields

# This will:
# 1. Create migration SQL
# 2. Apply to database
# 3. Regenerate Prisma Client
```

### 3. Update Existing Data (Optional)
Create `scripts/init-warranty-data.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Set all existing sales to have reminders enabled
  await prisma.sale.updateMany({
    where: {
      reminderOptOut: null
    },
    data: {
      reminderOptOut: false
    }
  })
  
  console.log('✅ Initialized warranty reminder preferences')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run with: `npx tsx scripts/init-warranty-data.ts`

## Testing Checklist

### ✅ Database Migration
- [ ] Migration runs without errors
- [ ] New fields appear in Sale table
- [ ] ActionLog table created successfully
- [ ] Indexes created properly

### ✅ Prisma Client
```typescript
// Test in a script or console
const testSale = await prisma.sale.findFirst()
console.log(testSale.reminderOptOut) // Should be false or null

const testLog = await prisma.actionLog.create({
  data: {
    machineId: 'test-machine-id',
    actionType: 'TEST',
    channel: 'WEB',
    metadata: { test: true }
  }
})
console.log(testLog) // Should create successfully
```

### ✅ Verify No Breaking Changes
- [ ] Existing API endpoints still work
- [ ] Dashboard loads correctly
- [ ] Machine pages display properly

## Rollback Plan
If issues occur:
```bash
# Revert migration
npx prisma migrate reset

# Or manually:
ALTER TABLE "Sale" DROP COLUMN "whatsappNumber";
ALTER TABLE "Sale" DROP COLUMN "reminderOptOut";
DROP TABLE "ActionLog";
```

## Environment Variables
No new environment variables needed for this step.

## Files Modified
- `prisma/schema.prisma` - Added new fields and model
- `prisma/migrations/` - New migration files created

## Success Criteria
- [x] Schema updated successfully
- [x] Migration applied to development database
- [x] Can create ActionLog entries
- [x] Can read/write reminder preferences on Sale
- [x] No existing functionality broken

## Next Step
Once database is ready, proceed to [Step 2: Health Calculations](./step-2-calculations.md)