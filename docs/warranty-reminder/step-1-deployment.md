# Step 1: Database Setup - Deployment Guide

## ✅ Completed Files

The following files have been created/modified for Step 1:

### 1. Schema Changes
- **Modified**: `prisma/schema.prisma`
  - Added `whatsappNumber` and `reminderOptOut` fields to `Sale` model
  - Added new `ActionLog` model with indexes

### 2. Migration Files
- **Created**: `prisma/migrations/manual_add_warranty_reminder_fields.sql`
  - Manual SQL migration file for database changes
  - Can be run directly if Prisma migrate isn't available

### 3. Scripts
- **Created**: `scripts/init-warranty-data.ts`
  - Initializes existing sales data with default values
  - Sets WhatsApp numbers from phone numbers
  - Tests ActionLog table creation

- **Created**: `scripts/test-warranty-db.ts`
  - Comprehensive test suite for database changes
  - Verifies all new fields and tables
  - Tests indexes and JSON metadata storage

## 🚀 Deployment Steps

### Option A: Using Prisma Migrate (Recommended)

1. **Set up environment variables**:
```bash
# Create .env file if it doesn't exist
echo "DATABASE_URL=postgresql://user:password@localhost:5432/dbname" > .env
```

2. **Run the migration**:
```bash
npx prisma migrate dev --name add_warranty_reminder_fields
```

3. **Initialize existing data**:
```bash
npx tsx scripts/init-warranty-data.ts
```

4. **Test the changes**:
```bash
npx tsx scripts/test-warranty-db.ts
```

### Option B: Manual SQL Migration

If you can't use Prisma migrate (e.g., in production):

1. **Connect to your database** and run:
```bash
psql -U username -d database_name -f prisma/migrations/manual_add_warranty_reminder_fields.sql
```

2. **Regenerate Prisma Client**:
```bash
npx prisma generate
```

3. **Initialize and test** (same as Option A, steps 3-4)

## 🧪 Verification Checklist

After deployment, verify:

- [ ] Sale table has `whatsappNumber` field
- [ ] Sale table has `reminderOptOut` field  
- [ ] ActionLog table exists
- [ ] ActionLog indexes are created
- [ ] Can create ActionLog entries
- [ ] Existing sales have `reminderOptOut = false`
- [ ] Test script passes all checks

## 🔄 Rollback Plan

If you need to rollback:

```sql
-- Remove ActionLog table
DROP TABLE IF EXISTS "ActionLog";

-- Remove fields from Sale table
ALTER TABLE "Sale" 
DROP COLUMN IF EXISTS "whatsappNumber",
DROP COLUMN IF EXISTS "reminderOptOut";
```

## 📝 Notes

- The migration is **safe** and **non-destructive**
- Default values are set for all existing records
- No existing functionality is affected
- The changes are backward compatible

## ✨ What's Next?

Once Step 1 is complete and verified:
- Proceed to [Step 2: Health Score Calculations](./implementation/step-2-calculations.md)
- The database is now ready for warranty reminder features

## 🤝 Need Help?

If you encounter issues:
1. Check that your DATABASE_URL is correctly set
2. Ensure PostgreSQL is running
3. Verify you have proper database permissions
4. Run the test script to identify specific issues