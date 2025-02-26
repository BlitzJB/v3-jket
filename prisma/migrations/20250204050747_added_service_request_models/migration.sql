/*
  Warnings:

  - A unique constraint covering the columns `[serviceRequestId]` on the table `ServiceVisit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceRequestId` to the `ServiceVisit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceVisitDate` to the `ServiceVisit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED');

-- AlterTable
ALTER TABLE "ServiceVisit" ADD COLUMN     "serviceRequestId" TEXT NOT NULL,
ADD COLUMN     "serviceVisitDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "serviceVisitNotes" TEXT,
ADD COLUMN     "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "serviceVisitId" TEXT,
    "complaint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceVisitComment" (
    "id" TEXT NOT NULL,
    "serviceVisitId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "attachments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceVisitComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_serviceVisitId_key" ON "ServiceRequest"("serviceVisitId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceVisit_serviceRequestId_key" ON "ServiceVisit"("serviceRequestId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisitComment" ADD CONSTRAINT "ServiceVisitComment_serviceVisitId_fkey" FOREIGN KEY ("serviceVisitId") REFERENCES "ServiceVisit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
