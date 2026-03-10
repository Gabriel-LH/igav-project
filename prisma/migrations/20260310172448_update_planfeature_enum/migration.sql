-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlanFeatureKey" ADD VALUE 'shifts';
ALTER TYPE "PlanFeatureKey" ADD VALUE 'payroll';
ALTER TYPE "PlanFeatureKey" ADD VALUE 'reports';

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "createdBy" SET DEFAULT 'system',
ALTER COLUMN "updatedBy" SET DEFAULT 'system';
