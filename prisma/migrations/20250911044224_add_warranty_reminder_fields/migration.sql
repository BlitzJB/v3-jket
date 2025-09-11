-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "reminderOptOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappNumber" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "public"."ActionLog" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionLog_machineId_actionType_createdAt_idx" ON "public"."ActionLog"("machineId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "ActionLog_createdAt_idx" ON "public"."ActionLog"("createdAt");
