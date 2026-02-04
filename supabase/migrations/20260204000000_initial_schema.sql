CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid,
	"patient_id" uuid NOT NULL,
	"provider_name" text,
	"provider_org" text,
	"ip_address" text,
	"user_agent" text,
	"access_method" text,
	"scope" text[],
	"accessed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" text NOT NULL,
	"name" text NOT NULL,
	"organization" text NOT NULL,
	"email" text,
	"department" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id")
);

CREATE TABLE "patient_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"employee_id" uuid,
	"provider_name" text NOT NULL,
	"provider_org" text,
	"provider_email" text,
	"scope" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patients_email_unique" UNIQUE("email")
);

CREATE TABLE "records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"hospital" text NOT NULL,
	"category" text NOT NULL,
	"data" jsonb NOT NULL,
	"record_date" date,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "share_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"token" text NOT NULL,
	"scope" text[] NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "share_tokens_token_unique" UNIQUE("token")
);

CREATE TABLE "summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"clinician_summary" text,
	"patient_summary" text,
	"anomalies" jsonb,
	"model_used" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_token_id_share_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."share_tokens"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "patient_providers" ADD CONSTRAINT "patient_providers_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "patient_providers" ADD CONSTRAINT "patient_providers_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "records" ADD CONSTRAINT "records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "share_tokens" ADD CONSTRAINT "share_tokens_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;