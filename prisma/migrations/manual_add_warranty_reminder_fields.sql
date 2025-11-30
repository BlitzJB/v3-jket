-- Add warranty reminder fields to Sale table
ALTER TABLE "Sale" 
ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "reminderOptOut" BOOLEAN DEFAULT false;

-- Create ActionLog table for tracking reminder history
CREATE TABLE IF NOT EXISTS "ActionLog" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "ActionLog_machineId_actionType_createdAt_idx" 
ON "ActionLog"("machineId", "actionType", "createdAt");

CREATE INDEX IF NOT EXISTS "ActionLog_createdAt_idx" 
ON "ActionLog"("createdAt");

-- Set default values for existing records
UPDATE "Sale" 
SET "reminderOptOut" = false 
WHERE "reminderOptOut" IS NULL;

UPDATE "Sale" 
SET "whatsappNumber" = "customerPhoneNumber" 
WHERE "whatsappNumber" IS NULL 
AND "customerPhoneNumber" IS NOT NULL;