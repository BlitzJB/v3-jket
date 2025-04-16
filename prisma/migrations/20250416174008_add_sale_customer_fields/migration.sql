-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerContactPersonName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "distributorInvoiceNumber" TEXT;
