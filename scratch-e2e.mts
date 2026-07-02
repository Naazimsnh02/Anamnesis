import { config } from "dotenv";
config({ path: ".env.local" });
import { randomUUID } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./src/lib/db/schema.ts";
import { datasetNameForPatient } from "./src/lib/patient.ts";
import { buildNarrative } from "./src/lib/narrative.ts";
import { mergeEntitiesIntoRoster } from "./src/lib/roster.ts";
import { SEED_PATIENTS } from "./src/lib/seed-data.ts";
const { cogneeRemember, cogneeRecall } = await import("./src/lib/cognee.ts");

const sql = postgres(process.env.POSTGRES_URL, { prepare: false });
const db = drizzle(sql, { schema });

// Mirrors POST /api/patients/seed-demo exactly, minus the Clerk auth layer,
// against the real fixed instance — end-to-end check that DB + roster +
// Cognee wiring all still work correctly post-migration.
const clerkOrgId = "org_e2e_final_test";
const [org] = await db.insert(schema.orgs).values({ clerkOrgId, name: "E2E Clinic" })
  .onConflictDoUpdate({ target: schema.orgs.clerkOrgId, set: { name: "E2E Clinic" } }).returning();

for (const seedPatient of SEED_PATIENTS) {
  const id = randomUUID();
  const [patient] = await db.insert(schema.patients).values({
    id, orgId: org.id, name: seedPatient.name, dob: seedPatient.dob,
    datasetName: datasetNameForPatient(id),
  }).returning();
  console.log(`\n${patient.name} -> ${patient.datasetName}`);
  for (const entities of seedPatient.documents.slice(0, 2)) { // just first 2 docs per patient, fast smoke test
    const narrative = buildNarrative(patient.name, entities);
    const { status } = await cogneeRemember(narrative, patient.datasetName);
    console.log(`  remembered ${entities.documentType} (${entities.documentDate}): ${status}`);
  }
}

console.log("\nwaiting 15s for cognify...");
await new Promise((r) => setTimeout(r, 15000));

const patients = await db.select().from(schema.patients).where(schema.eq ? undefined as never : undefined as never);
const rows = await sql`select id, name, dataset_name from patients where org_id = ${org.id}`;
for (const p of rows) {
  const res = await cogneeRecall("What diagnoses or medications does this patient have?", p.dataset_name, { includeReferences: true });
  const text = (res.body as any)?.[0]?.text ?? JSON.stringify(res.body);
  console.log(`\n${p.name}: ${text.slice(0, 150)}`);
}

const { cogneeForget } = await import("./src/lib/cognee.ts");
for (const p of rows) {
  const r = await cogneeForget({ dataset: p.dataset_name, memoryOnly: false });
  console.log(`cleanup ${p.name}:`, r.status);
}
await sql`delete from patients where org_id = ${org.id}`;
await sql`delete from orgs where id = ${org.id}`;
await sql.end();
