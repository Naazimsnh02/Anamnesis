// Phase 5 multi-tenant app/tenancy schema. This is deliberately NOT where
// clinical facts live — Cognee's graph stays the one source of truth for
// diagnoses/medications/relationships. These tables hold the app-level state
// Cognee has no concept of: which org a patient belongs to, who's allowed to
// see them, and the active/ruled-out status roster (see roster.ts's old
// comment for why status can't be a literal Cognee forget() call).
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const orgs = pgTable("orgs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: text("clerk_org_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("orgs_clerk_org_id_idx").on(t.clerkOrgId)]);

export const clinicians = pgTable("clinicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  // "admin" can manage org membership/patients; "physician"/"staff" are both
  // clinical roles for now (no permission split between them yet).
  role: text("role", { enum: ["admin", "physician", "staff"] }).notNull().default("physician"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("clinicians_org_clerk_user_idx").on(t.orgId, t.clerkUserId),
  index("clinicians_org_id_idx").on(t.orgId),
]);

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dob: text("dob").notNull(),
  // One Cognee dataset per patient, unchanged from the hackathon build's
  // DEMO_PATIENT.datasetName convention.
  datasetName: text("dataset_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("patients_dataset_name_idx").on(t.datasetName),
  index("patients_org_id_idx").on(t.orgId),
]);

// Explicit clinician<->patient assignment. Until Phase 5's "single org to
// start" grows into real access control, every clinician in an org can see
// every patient in that org (enforced in the data-access layer, not by this
// table being empty) — this table exists so fine-grained assignment can be
// turned on later without a schema change.
export const patientAssignments = pgTable("patient_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  clinicianId: uuid("clinician_id").notNull().references(() => clinicians.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("patient_assignments_unique_idx").on(t.patientId, t.clinicianId)]);

export const rosterDiagnoses = pgTable("roster_diagnoses", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  firstDate: text("first_date"),
  status: text("status", { enum: ["active", "ruled_out"] }).notNull().default("active"),
  ruledOutDate: text("ruled_out_date"),
  ruledOutNote: text("ruled_out_note"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("roster_diagnoses_patient_name_idx").on(t.patientId, t.name),
  index("roster_diagnoses_patient_id_idx").on(t.patientId),
]);

export const rosterMedications = pgTable("roster_medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dosage: text("dosage"),
  firstDate: text("first_date"),
  status: text("status", { enum: ["current", "discontinued"] }).notNull().default("current"),
  discontinuedDate: text("discontinued_date"),
  discontinuedNote: text("discontinued_note"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("roster_medications_patient_name_idx").on(t.patientId, t.name),
  index("roster_medications_patient_id_idx").on(t.patientId),
]);

// Document registry used for duplicate detection (same type + date) before
// an upload's remember() call — mirrors the old roster.ts's
// findDuplicateDocument(), now keyed relationally instead of scanning a JSON
// blob.
export const rosterDocuments = pgTable("roster_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  dataId: text("data_id").notNull(),
  documentType: text("document_type").notNull(),
  documentDate: text("document_date"),
  narrative: text("narrative").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("roster_documents_patient_id_idx").on(t.patientId),
  index("roster_documents_patient_type_date_idx").on(t.patientId, t.documentType, t.documentDate),
]);

// Compliance trail: every read/write of patient data. Distinct from the
// Cognee operations log (which shows remember/recall/improve/forget calls
// for judging/product visibility) — this is "who looked at or changed what,
// when," the record a real access review or breach investigation needs.
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "set null" }),
  actorClerkUserId: text("actor_clerk_user_id").notNull(),
  action: text("action").notNull(),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("audit_log_org_id_idx").on(t.orgId),
  index("audit_log_patient_id_idx").on(t.patientId),
  index("audit_log_created_at_idx").on(t.createdAt),
]);

// Fixed-window rate-limit counters (Phase 6 hardening). `key` is caller-built
// (e.g. "clinician:<id>:upload") so one table serves every rate-limited
// route instead of one table per route. Vercel serverless functions are
// stateless between invocations, so this has to live in Postgres rather than
// in-memory to actually work across instances.
export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
}, (t) => [uniqueIndex("rate_limit_buckets_key_window_idx").on(t.key, t.windowStart)]);
