-- Create organizations table
CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);

-- Add organization_id column to employees (temporarily nullable for migration)
ALTER TABLE "employees" ADD COLUMN "organization_id" uuid;

-- Create a default organization for existing employees
INSERT INTO "organizations" ("slug", "name")
SELECT DISTINCT
  lower(regexp_replace(organization, '[^a-zA-Z0-9]+', '-', 'g')),
  organization
FROM "employees"
WHERE organization IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Backfill organization_id from organization text field
UPDATE "employees" e
SET "organization_id" = o.id
FROM "organizations" o
WHERE lower(regexp_replace(e.organization, '[^a-zA-Z0-9]+', '-', 'g')) = o.slug;

-- Make organization_id NOT NULL after backfill
ALTER TABLE "employees" ALTER COLUMN "organization_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk"
FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;

-- Drop old unique constraint on employee_id
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_employee_id_unique";

-- Create new composite unique index
CREATE UNIQUE INDEX "employees_org_employee_id_unique" ON "employees" ("organization_id", "employee_id");

-- Drop old organization text column
ALTER TABLE "employees" DROP COLUMN IF EXISTS "organization";
