/*
  Warnings:

  - Added the required column `testResultData` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "testAdditionalNotes" TEXT,
ADD COLUMN     "testResultData" JSONB NOT NULL;
