DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tenant_member_ship'
      AND column_name = 'pin'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tenant_member_ship'
      AND column_name = 'pinHash'
  ) THEN
    ALTER TABLE "tenant_member_ship" RENAME COLUMN "pin" TO "pinHash";
  END IF;
END $$;

ALTER TABLE "tenant_member_ship"
ADD COLUMN IF NOT EXISTS "pinHash" TEXT;

ALTER TABLE "tenant_member_ship"
ADD COLUMN IF NOT EXISTS "pinSetAt" TIMESTAMP(3);
