-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'AED';

-- AlterTable
ALTER TABLE "PayrollItem" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'AED';

-- AlterTable
ALTER TABLE "SalaryStructure" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'AED';

-- Backfill: set currency from the owning tenant for rows created before this migration.
UPDATE "SalaryStructure" s
SET "currency" = t."currency"
FROM "Tenant" t
WHERE s."tenantId" = t."id" AND s."currency" = 'AED';

UPDATE "Payroll" p
SET "currency" = t."currency"
FROM "Tenant" t
WHERE p."tenantId" = t."id" AND p."currency" = 'AED';

UPDATE "PayrollItem" pi
SET "currency" = t."currency"
FROM "Tenant" t
WHERE pi."tenantId" = t."id" AND pi."currency" = 'AED';
