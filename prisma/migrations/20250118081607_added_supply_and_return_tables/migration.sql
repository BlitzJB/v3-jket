-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "returnId" TEXT,
ADD COLUMN     "supplyId" TEXT;

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "supplyDate" TIMESTAMP(3) NOT NULL,
    "sellBy" TIMESTAMP(3) NOT NULL,
    "distributorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "returnReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supply_machineId_key" ON "Supply"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "Return_machineId_key" ON "Return"("machineId");

-- AddForeignKey
ALTER TABLE "Supply" ADD CONSTRAINT "Supply_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supply" ADD CONSTRAINT "Supply_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
