-- Create organizations table
CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint

-- Add organization_id column to employees (temporarily nullable for migration)
ALTER TABLE "employees" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint

-- Create a default organization for existing employees
INSERT INTO "organizations" ("slug", "name")
SELECT DISTINCT
  lower(regexp_replace(organization, '[^a-zA-Z0-9]+', '-', 'g')),
  organization
FROM "employees"
WHERE organization IS NOT NULL
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

-- Backfill organization_id from organization text field
UPDATE "employees" e
SET "organization_id" = o.id
FROM "organizations" o
WHERE lower(regexp_replace(e.organization, '[^a-zA-Z0-9]+', '-', 'g')) = o.slug;
--> statement-breakpoint

-- Make organization_id NOT NULL after backfill
ALTER TABLE "employees" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk"
FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Drop old unique constraint on employee_id
ALTER TABLE "employees" DROP CONSTRAINT "employees_employee_id_unique";
--> statement-breakpoint

-- Create new composite unique index
CREATE UNIQUE INDEX "employees_org_employee_id_unique" ON "employees" ("organization_id", "employee_id");
--> statement-breakpoint

-- Drop old organization text column
ALTER TABLE "employees" DROP COLUMN "organization";
