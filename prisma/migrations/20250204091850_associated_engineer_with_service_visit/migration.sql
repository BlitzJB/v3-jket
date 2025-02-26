-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "attachments" JSONB;

-- AlterTable
ALTER TABLE "ServiceVisit" ADD COLUMN     "engineerId" TEXT;

-- AddForeignKey
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
