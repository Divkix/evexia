-- Add emergency access columns for ER doctor bypass feature
ALTER TABLE "patients" ADD COLUMN "allow_emergency_access" boolean DEFAULT false NOT NULL;
ALTER TABLE "employees" ADD COLUMN "is_emergency_staff" boolean DEFAULT false NOT NULL;
ALTER TABLE "access_logs" ADD COLUMN "is_emergency_access" boolean DEFAULT false NOT NULL;

-- Add index for efficient emergency staff lookup
CREATE INDEX "employees_emergency_staff_idx" ON "employees" ("is_emergency_staff") WHERE "is_emergency_staff" = true;
