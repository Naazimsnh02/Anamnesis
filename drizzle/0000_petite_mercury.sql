CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"patient_id" uuid,
	"actor_clerk_user_id" text NOT NULL,
	"action" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'physician' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"clinician_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"dob" text NOT NULL,
	"dataset_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster_diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"name" text NOT NULL,
	"first_date" text,
	"status" text DEFAULT 'active' NOT NULL,
	"ruled_out_date" text,
	"ruled_out_note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"data_id" text NOT NULL,
	"document_type" text NOT NULL,
	"document_date" text,
	"narrative" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster_medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"name" text NOT NULL,
	"dosage" text,
	"first_date" text,
	"status" text DEFAULT 'current' NOT NULL,
	"discontinued_date" text,
	"discontinued_note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinicians" ADD CONSTRAINT "clinicians_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assignments" ADD CONSTRAINT "patient_assignments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_assignments" ADD CONSTRAINT "patient_assignments_clinician_id_clinicians_id_fk" FOREIGN KEY ("clinician_id") REFERENCES "public"."clinicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_diagnoses" ADD CONSTRAINT "roster_diagnoses_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_documents" ADD CONSTRAINT "roster_documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_medications" ADD CONSTRAINT "roster_medications_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_org_id_idx" ON "audit_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "audit_log_patient_id_idx" ON "audit_log" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "clinicians_org_clerk_user_idx" ON "clinicians" USING btree ("org_id","clerk_user_id");--> statement-breakpoint
CREATE INDEX "clinicians_org_id_idx" ON "clinicians" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orgs_clerk_org_id_idx" ON "orgs" USING btree ("clerk_org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_assignments_unique_idx" ON "patient_assignments" USING btree ("patient_id","clinician_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patients_dataset_name_idx" ON "patients" USING btree ("dataset_name");--> statement-breakpoint
CREATE INDEX "patients_org_id_idx" ON "patients" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roster_diagnoses_patient_name_idx" ON "roster_diagnoses" USING btree ("patient_id","name");--> statement-breakpoint
CREATE INDEX "roster_diagnoses_patient_id_idx" ON "roster_diagnoses" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "roster_documents_patient_id_idx" ON "roster_documents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "roster_documents_patient_type_date_idx" ON "roster_documents" USING btree ("patient_id","document_type","document_date");--> statement-breakpoint
CREATE UNIQUE INDEX "roster_medications_patient_name_idx" ON "roster_medications" USING btree ("patient_id","name");--> statement-breakpoint
CREATE INDEX "roster_medications_patient_id_idx" ON "roster_medications" USING btree ("patient_id");