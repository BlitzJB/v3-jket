-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "reminderOptOut" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'SYSTEM',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionLog_machineId_idx" ON "ActionLog"("machineId");

-- CreateIndex
CREATE INDEX "ActionLog_actionType_idx" ON "ActionLog"("actionType");

-- CreateIndex
CREATE INDEX "ActionLog_createdAt_idx" ON "ActionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
