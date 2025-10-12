-- Migration: Add encrypted temporary password field
-- This migration adds a field to store encrypted passwords until user approval

ALTER TABLE "User" ADD COLUMN "encryptedTemporaryPassword" TEXT;

COMMENT ON COLUMN "User"."encryptedTemporaryPassword" IS 'Stores encrypted password until user is approved';

-- Rollback:
-- To reverse this migration, run the following command:
-- ALTER TABLE "User" DROP COLUMN "encryptedTemporaryPassword";
