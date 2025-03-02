-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "testConfiguration" JSONB;

-- AlterTable
ALTER TABLE "ServiceVisit" ADD COLUMN     "customerSupportNotes" TEXT DEFAULT '';
