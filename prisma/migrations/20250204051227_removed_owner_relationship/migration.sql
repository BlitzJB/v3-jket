/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Machine` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Machine" DROP CONSTRAINT "Machine_ownerId_fkey";

-- AlterTable
ALTER TABLE "Machine" DROP COLUMN "ownerId";
