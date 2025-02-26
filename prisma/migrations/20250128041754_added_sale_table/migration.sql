-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "saleId" TEXT;

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhoneNumber" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_machineId_key" ON "Sale"("machineId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
